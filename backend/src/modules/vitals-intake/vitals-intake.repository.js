/**
 * Vitals Intake Repository
 * 
 * Handles all direct database operations for the Sprint 2 vitals-intake module.
 * Operates on the `vitals` table (separate from Sprint 1 `vital_signs` table).
 * 
 * @module modules/vitals-intake/repository
 */

const pool = require("../../config/db");

// =============================================================================
// INSERT OPERATIONS
// =============================================================================

/**
 * Insert a new vital signs record
 * 
 * @param {Object} data - Vitals data
 * @param {string} data.patient_id - Patient UUID
 * @param {number} data.heart_rate - Heart rate in bpm
 * @param {string} data.blood_pressure - Blood pressure as text (e.g., "120/80")
 * @param {number} data.temperature - Body temperature (decimal)
 * @param {number} data.spo2 - Oxygen saturation percentage
 * @returns {Object} The inserted vital record
 */
exports.insertVital = async (data) => {
    const query = `
    INSERT INTO vitals (patient_id, heart_rate, blood_pressure, temperature, spo2)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, patient_id, heart_rate, blood_pressure, temperature, spo2, created_at
  `;

    const values = [
        data.patient_id,
        data.heart_rate,
        data.blood_pressure,
        data.temperature,
        data.spo2,
    ];

    const { rows } = await pool.query(query, values);
    return rows[0];
};

// =============================================================================
// SELECT OPERATIONS
// =============================================================================

/**
 * Get all vitals for a specific patient, ordered by most recent first
 * 
 * @param {string} patientId - Patient UUID
 * @returns {Array} Array of vital records
 */
exports.getVitalsByPatientId = async (patientId) => {
    const query = `
    SELECT id, patient_id, heart_rate, blood_pressure, temperature, spo2, created_at
    FROM vitals
    WHERE patient_id = $1
    ORDER BY created_at DESC
  `;

    const { rows } = await pool.query(query, [patientId]);
    return rows;
};
