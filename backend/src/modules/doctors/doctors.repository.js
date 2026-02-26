/**
 * Doctors Repository
**/

// Database connection pool
const pool = require("../../config/db");

// =============================================================================
// DATABASE QUERIES
// =============================================================================

/**
 * Get All Active Doctors
 * 
 * Retrieves all doctors where is_active = true, ordered alphabetically
 * by full name. Returns only essential fields for listing purposes.
 */
exports.getAllDoctors = async () => {
  const query = `
    SELECT doctor_id, full_name, specialization
    FROM doctors
    WHERE is_active = true
    ORDER BY full_name ASC
  `;
  const { rows } = await pool.query(query);
  return rows;
};
