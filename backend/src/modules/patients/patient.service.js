/**
 * Patient Service
 * 
 * This service layer contains business logic for patient management.
 * Handles patient creation, PII encryption, and user account linking.
 * 
 * PII Protection:
 * - Patient names are encrypted using AES-256 before storage
 * - Medical record numbers are auto-generated
 * - Minor status is automatically determined from DOB
 * 
 * @module modules/patients/service
 */

// Database connection pool
const pool = require("../../config/db");

// Password hashing for user accounts
const bcrypt = require("bcrypt");

// Encryption utility for PII
const { encrypt } = require("../../utils/encryption");

// =============================================================================
// PATIENT CREATION (without user account)
// =============================================================================

/**
 * Create Patient Record
 * 
 * Creates a patient record without linking to a user account.
 * Used for legacy records or manual data entry by staff.
 * 
 * Features:
 * - Encrypts patient name for PII protection
 * - Auto-generates unique Medical Record Number (MRN)
 * - Automatically calculates is_minor flag from DOB
 * 
 * Input:
 * - data.full_name: string (Will be encrypted)
 * - data.dob: string (YYYY-MM-DD)
 * - data.gender: string
 * - data.blood_group: string (Optional)
 * 
 * Output:
 * - Object: Created patient record from DB (including generated keys like patient_id, mrn).
 * 
 * @param {Object} data - Patient data
 * @param {string} [data.user_id] - Optional user ID to link (usually null)
 * @param {string} data.full_name - Patient's full name (will be encrypted)
 * @param {string} data.dob - Date of birth
 * @param {string} data.gender - Gender
 * @param {string} data.blood_group - Blood group
 * @returns {Object} Created patient record
 */
async function createPatient(data) {
  const {
    user_id = null,  // Optional user link (usually null for manual creation)
    full_name,
    dob,
    gender,
    blood_group
  } = data;

  // 🔐 Encrypt the patient name for PII protection
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

// =============================================================================
// PATIENT LISTING
// =============================================================================

/**
 * Get All Patients
 * 
 * Retrieves all active (non-deleted) patients from the database.
 * Note: Names are returned encrypted and must be decrypted by controller.
 * 
 * Input:
 * - None
 * 
 * Output:
 * - Array: List of patient objects with encrypted names.
 * 
 * @returns {Array} Array of patient records (names still encrypted)
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

// =============================================================================
// PATIENT REGISTRATION (with user account)
// =============================================================================

/**
 * Register Patient with User Account
 * 
 * Creates both a user account AND a patient record, linking them together.
 * This enables patients to log into the patient portal.
 * 
 * Steps:
 * 1. Check username uniqueness
 * 2. Hash password with bcrypt
 * 3. Create user record
 * 4. Create patient record linked to user
 * 
 * Input:
 * - data.username: string
 * - data.password: string
 * - data.full_name: string
 * - data.dob: string
 * 
 * Output:
 * - Object: Created patient record linked to the new user.
 * 
 * @param {Object} data - Registration data
 * @param {string} data.username - Unique username for login
 * @param {string} data.password - Password (will be hashed)
 * @param {string} data.full_name - Patient's full name (will be encrypted)
 * @param {string} data.dob - Date of birth
 * @param {string} data.gender - Gender
 * @param {string} data.blood_group - Blood group
 * @returns {Object} Created patient record
 * @throws {Error} If username already exists
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

  // 2️⃣ Hash password with bcrypt (salt rounds = 10)
  const passwordHash = await bcrypt.hash(password, 10);

  // 3️⃣ Create user account
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

  // 🔐 Encrypt patient name for PII protection
  const encryptedName = encrypt(full_name);

  // 4️⃣ Create patient record linked to user
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

/**
 * Get Patient Record by User ID
 * 
 * Retrieves the patient record associated with a specific user account.
 * 
 * @param {string} userId - User UUID
 * @returns {Object|null} Patient record or null if not found
 */
async function getPatientByUserId(userId) {
  const result = await pool.query(
    `SELECT * FROM patients WHERE user_id = $1 AND deleted_at IS NULL`,
    [userId]
  );
  return result.rows[0] || null;
}

/**
 * Handle GDPR Right to Erasure Request
 * 
 * Anonymizes PII in `users` and `patients` tables to comply with data protection laws.
 * Soft-deletes user account but keeps non-identifiable medical history intact.
 * 
 * @param {string} userId - User UUID to be erased
 */
async function requestDataErasure(userId) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Anonymize user account data
    // Sets username to a generic deleted identifier to release original username
    // and clears password hash.
    await client.query(`
      UPDATE users 
      SET 
        username = 'deleted_user_' || substr(user_id::text, 1, 8),
        password_hash = 'erased',
        is_active = false,
        mfa_enabled = false,
        deleted_at = NOW()
      WHERE user_id = $1
    `, [userId]);

    // 2. Anonymize patient PII
    // Replace encrypted name with placeholder, scrub dob and other profiling data.
    const anonymizedName = encrypt("Deleted User");
    await client.query(`
      UPDATE patients
      SET
        full_name_encrypted = $2,
        dob = '1900-01-01',
        gender = 'Other',
        blood_group = 'O+',
        deleted_at = NOW()
      WHERE user_id = $1
    `, [userId, anonymizedName]);

    await client.query('COMMIT');
    return { success: true, message: "User data successfully erased and anonymized." };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Error during GDPR erasure process:", error);
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  createPatient,
  getAllPatients,
  registerPatientWithUser,
  getPatientByUserId,
  requestDataErasure
};
