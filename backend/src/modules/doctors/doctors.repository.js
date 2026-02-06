const pool = require("../../config/db");

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
