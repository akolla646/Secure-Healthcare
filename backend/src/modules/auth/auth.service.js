const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const pool = require("../../config/db");
const { generateOTP, hashOTP } = require("../../utils/otp");
const { sendOTPEmail } = require("../../utils/email");

/**
 * LOGIN – STEP 1 (Password check)
 */
exports.login = async (username, password) => {
  const { rows } = await pool.query(
    `
    SELECT 
      u.user_id,
      u.password_hash,
      u.mfa_enabled,
      r.role_name
    FROM users u
    JOIN user_roles ur ON u.user_id = ur.user_id
    JOIN roles r ON ur.role_id = r.role_id
    WHERE u.username = $1
      AND u.is_active = true
      AND u.is_locked = false
      AND u.password_hash IS NOT NULL
    `,
    [username]
  );

  if (!rows.length) {
    throw new Error("Invalid credentials");
  }

  const user = rows[0];

  const validPassword = await bcrypt.compare(password, user.password_hash);
  if (!validPassword) {
    throw new Error("Invalid credentials");
  }

  /**
   * MFA ENABLED → SEND OTP
   */
  if (user.mfa_enabled) {
    await pool.query(
      `
      UPDATE email_otps
      SET used = true
      WHERE user_id = $1 AND purpose = 'LOGIN_MFA'
      `,
      [user.user_id]
    );

    const otp = generateOTP();
    const otpHash = hashOTP(otp);

    await pool.query(
      `
      INSERT INTO email_otps (user_id, otp_hash, purpose, expires_at)
      VALUES (
        $1,
        $2,
        'LOGIN_MFA',
        now() + interval '${process.env.OTP_EXPIRY_MINUTES} minutes'
      )
      `,
      [user.user_id, otpHash]
    );

    // 🔒 EMAIL REDIRECTED FOR TESTING (email.js handles this)
    await sendOTPEmail(username, otp);

    return {
      mfaRequired: true,
      message: "OTP sent for MFA verification"
    };
  }

  /**
   * MFA DISABLED → ISSUE TOKEN
   */
  return issueJWT(user.user_id, user.role_name);
};

/**
 * LOGIN – STEP 2 (OTP Verification)
 */
exports.verifyLoginOTP = async (username, otp) => {
  const otpHash = hashOTP(otp);

  const { rows } = await pool.query(
    `
    SELECT 
      u.user_id,
      r.role_name,
      eo.otp_id
    FROM email_otps eo
    JOIN users u ON eo.user_id = u.user_id
    JOIN user_roles ur ON u.user_id = ur.user_id
    JOIN roles r ON ur.role_id = r.role_id
    WHERE u.username = $1
      AND eo.otp_hash = $2
      AND eo.purpose = 'LOGIN_MFA'
      AND eo.used = false
      AND eo.expires_at > now()
    `,
    [username, otpHash]
  );

  if (!rows.length) {
    throw new Error("Invalid or expired OTP");
  }

  const user = rows[0];

  await pool.query(
    `UPDATE email_otps SET used = true WHERE otp_id = $1`,
    [user.otp_id]
  );

  return issueJWT(user.user_id, user.role_name);
};

/**
 * ADMIN – CREATE USER
 */
exports.adminCreateUser = async (email, role) => {
  const existing = await pool.query(
    `SELECT 1 FROM users WHERE username = $1`,
    [email]
  );

  if (existing.rowCount) {
    throw new Error("User already exists");
  }

  const userRes = await pool.query(
    `
    INSERT INTO users (username, mfa_enabled, is_active)
    VALUES ($1, true, false)
    RETURNING user_id
    `,
    [email]
  );

  const userId = userRes.rows[0].user_id;

  const roleRes = await pool.query(
    `SELECT role_id FROM roles WHERE role_name = $1`,
    [role]
  );

  if (!roleRes.rowCount) {
    throw new Error("Invalid role");
  }

  await pool.query(
    `INSERT INTO user_roles (user_id, role_id)
     VALUES ($1, $2)`,
    [userId, roleRes.rows[0].role_id]
  );

  await pool.query(
    `UPDATE email_otps SET used = true WHERE user_id = $1`,
    [userId]
  );

  const otp = generateOTP();
  const otpHash = hashOTP(otp);

  await pool.query(
    `
    INSERT INTO email_otps (user_id, otp_hash, purpose, expires_at)
    VALUES (
      $1,
      $2,
      'ACTIVATION',
      now() + interval '${process.env.OTP_EXPIRY_MINUTES} minutes'
    )
    `,
    [userId, otpHash]
  );

  // 🔒 EMAIL REDIRECTED FOR TESTING
  await sendOTPEmail(email, otp);

  return { message: "User created and activation OTP sent" };
};

/**
 * ACTIVATE USER ACCOUNT
 */
exports.activateAccount = async (email, otp, password) => {
  const otpHash = hashOTP(otp);

  const { rows } = await pool.query(
    `
    SELECT eo.otp_id, eo.user_id
    FROM email_otps eo
    JOIN users u ON eo.user_id = u.user_id
    WHERE u.username = $1
      AND eo.otp_hash = $2
      AND eo.purpose = 'ACTIVATION'
      AND eo.used = false
      AND eo.expires_at > now()
    `,
    [email, otpHash]
  );

  if (!rows.length) {
    throw new Error("Invalid or expired OTP");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const userId = rows[0].user_id;

  await pool.query(
    `
    UPDATE users
    SET password_hash = $1,
        is_active = true
    WHERE user_id = $2
    `,
    [passwordHash, userId]
  );

  await pool.query(
    `UPDATE email_otps SET used = true WHERE otp_id = $1`,
    [rows[0].otp_id]
  );

  await pool.query(
    `INSERT INTO password_history (user_id, password_hash)
     VALUES ($1, $2)`,
    [userId, passwordHash]
  );

  return { message: "Account activated successfully" };
};

/**
 * FORGOT PASSWORD
 */
exports.forgotPassword = async (email) => {
  const { rows } = await pool.query(
    `
    SELECT user_id FROM users
    WHERE username = $1
      AND is_active = true
      AND is_locked = false
    `,
    [email]
  );

  if (!rows.length) {
    throw new Error("User not found or inactive");
  }

  const userId = rows[0].user_id;

  await pool.query(
    `
    UPDATE email_otps
    SET used = true
    WHERE user_id = $1 AND purpose = 'RESET_PASSWORD'
    `,
    [userId]
  );

  const otp = generateOTP();
  const otpHash = hashOTP(otp);

  await pool.query(
    `
    INSERT INTO email_otps (user_id, otp_hash, purpose, expires_at)
    VALUES (
      $1,
      $2,
      'RESET_PASSWORD',
      now() + interval '${process.env.OTP_EXPIRY_MINUTES} minutes'
    )
    `,
    [userId, otpHash]
  );

  // 🔒 EMAIL REDIRECTED FOR TESTING
  await sendOTPEmail(email, otp);

  return { message: "Password reset OTP sent" };
};

/**
 * RESET PASSWORD
 */
exports.resetPassword = async (email, otp, newPassword) => {
  const otpHash = hashOTP(otp);

  const { rows } = await pool.query(
    `
    SELECT eo.otp_id, eo.user_id
    FROM email_otps eo
    JOIN users u ON eo.user_id = u.user_id
    WHERE u.username = $1
      AND eo.otp_hash = $2
      AND eo.purpose = 'RESET_PASSWORD'
      AND eo.used = false
      AND eo.expires_at > now()
    `,
    [email, otpHash]
  );

  if (!rows.length) {
    throw new Error("Invalid or expired OTP");
  }

  const userId = rows[0].user_id;
  const passwordHash = await bcrypt.hash(newPassword, 12);

  await pool.query(
    `UPDATE users SET password_hash = $1 WHERE user_id = $2`,
    [passwordHash, userId]
  );

  await pool.query(
    `UPDATE email_otps SET used = true WHERE otp_id = $1`,
    [rows[0].otp_id]
  );

  await pool.query(
    `INSERT INTO password_history (user_id, password_hash)
     VALUES ($1, $2)`,
    [userId, passwordHash]
  );

  await pool.query(
    `UPDATE sessions SET is_valid = false WHERE user_id = $1`,
    [userId]
  );

  return { message: "Password reset successful" };
};

/**
 * ISSUE JWT
 */
function issueJWT(userId, role) {
  const token = jwt.sign(
    { user_id: userId, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
  );

  return { token, role, user_id: userId };
}
