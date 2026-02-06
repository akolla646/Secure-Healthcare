const pool = require("../../config/db");
const bcrypt = require("bcrypt");
const { encrypt } = require("../../utils/encryption");

/**
 * CREATE patient (WITHOUT user account)
 */
async function createPatient(data) {
  const {
    user_id = null,
    full_name,
    dob,
    gender,
    blood_group
  } = data;

  const encryptedName = encrypt(full_name);

  const result = await pool.query(
    `
    INSERT INTO patients (
      patient_id,
      user_id,
      medical_record_number,
      full_name_encrypted,
      dob,
      gender,
      blood_group,
      is_minor,
      deceased
    )
    VALUES (
      gen_random_uuid(),
      $1,
      'MRN-' || floor(random() * 1000000),
      $2,
      $3::date,
      $4,
      $5,
      CASE
        WHEN age($3::date) < interval '18 years' THEN true
        ELSE false
      END,
      false
    )
    RETURNING *
    `,
    [user_id, encryptedName, dob, gender, blood_group]
  );

  return result.rows[0];
}

/**
 * GET all patients
 */
async function getAllPatients() {
  const result = await pool.query(
    `
    SELECT
      patient_id,
      user_id,
      medical_record_number,
      full_name_encrypted,
      dob,
      gender,
      blood_group,
      is_minor,
      deceased,
      created_at
    FROM patients
    WHERE deleted_at IS NULL
    ORDER BY created_at DESC
    `
  );

  return result.rows;
}

/**
 * REGISTER patient WITH user account
 */
async function registerPatientWithUser(data) {
  const {
    username,
    password,
    full_name,
    dob,
    gender,
    blood_group
  } = data;

  // 1️⃣ Check username uniqueness
  const existingUser = await pool.query(
    `SELECT user_id FROM users WHERE username = $1 AND deleted_at IS NULL`,
    [username]
  );

  if (existingUser.rows.length > 0) {
    throw new Error("Username already exists");
  }

  // 2️⃣ Hash password
  const passwordHash = await bcrypt.hash(password, 10);

  // 3️⃣ Create user
  const userResult = await pool.query(
    `
    INSERT INTO users (
      user_id,
      username,
      password_hash,
      mfa_enabled,
      is_active,
      is_locked
    )
    VALUES (
      gen_random_uuid(),
      $1,
      $2,
      false,
      true,
      false
    )
    RETURNING user_id
    `,
    [username, passwordHash]
  );

  const user_id = userResult.rows[0].user_id;
  const encryptedName = encrypt(full_name);

  // 4️⃣ Create patient linked to user
  const patientResult = await pool.query(
    `
    INSERT INTO patients (
      patient_id,
      user_id,
      medical_record_number,
      full_name_encrypted,
      dob,
      gender,
      blood_group,
      is_minor,
      deceased
    )
    VALUES (
      gen_random_uuid(),
      $1,
      'MRN-' || floor(random() * 1000000),
      $2,
      $3::date,
      $4,
      $5,
      CASE
        WHEN age($3::date) < interval '18 years' THEN true
        ELSE false
      END,
      false
    )
    RETURNING *
    `,
    [user_id, encryptedName, dob, gender, blood_group]
  );

  return patientResult.rows[0];
}

module.exports = {
  createPatient,
  getAllPatients,
  registerPatientWithUser
};
