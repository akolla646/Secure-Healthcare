/**
 * Appointments Repository
 * Handles all database operations for appointments.
 * Follows Repository Pattern (DB logic only).
 */

const pool = require("../../config/db");

// ============================
// DOCTOR QUERIES
// ============================

// Get appointments for a doctor (includes patient info)
exports.getAppointmentsForDoctor = async (doctorUserId) => {
  const query = `
    SELECT
      a.appointment_id,
      a.scheduled_start,
      a.scheduled_end,
      a.status,
      a.reason,
      p.patient_id,
      p.full_name_encrypted as patient_name,
      p.dob as date_of_birth
    FROM appointments a
    JOIN patients p ON a.patient_id = p.patient_id
    JOIN users u ON p.user_id = u.user_id
    JOIN doctors d ON a.doctor_id = d.doctor_id
    WHERE d.user_id = $1
    ORDER BY a.scheduled_start ASC
  `;
  const { rows } = await pool.query(query, [doctorUserId]);
  return rows;
};

// Find active doctor by name
exports.getDoctorByName = async (doctor_name) => {
  const result = await pool.query(
    `
    SELECT doctor_id
    FROM doctors
    WHERE LOWER(full_name) = LOWER($1)
      AND is_active = true
    `,
    [doctor_name]
  );
  return result.rows[0];
};

// Verify doctor role via user_roles
exports.isDoctor = async (doctorId) => {
  const query = `
    SELECT 1
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.role_id
    WHERE ur.user_id = (
      SELECT user_id FROM doctors WHERE doctor_id = $1
    )
    AND r.role_name = 'DOCTOR'
  `;
  const { rowCount } = await pool.query(query, [doctorId]);
  return rowCount > 0;
};

// Check doctor availability for time slot
exports.isDoctorAvailable = async (doctorId, dayOfWeek, startTime, endTime) => {
  const query = `
    SELECT 1
    FROM doctor_availability
    WHERE doctor_id = $1
      AND day_of_week = $2
      AND $3 >= start_time
      AND $4 <= end_time
      AND is_active = TRUE
  `;
  const { rowCount } = await pool.query(query, [
    doctorId,
    dayOfWeek,
    startTime,
    endTime
  ]);
  return rowCount > 0;
};

// ============================
// PATIENT QUERIES
// ============================

// Get appointments for a patient (includes doctor info)
exports.getAppointmentsForPatient = async (patientId) => {
  const query = `
    SELECT
      a.appointment_id,
      a.scheduled_start,
      a.scheduled_end,
      a.status,
      a.reason,
      d.full_name as doctor_name,
      d.specialization
    FROM appointments a
    JOIN doctors d ON a.doctor_id = d.doctor_id
    WHERE a.patient_id = $1
    ORDER BY a.scheduled_start ASC
  `;
  const { rows } = await pool.query(query, [patientId]);
  return rows;
};

// Resolve patient_id from user_id
exports.getPatientIdByUserId = async (userId) => {
  const query = `
    SELECT patient_id
    FROM patients
    WHERE user_id = $1
  `;
  const { rows } = await pool.query(query, [userId]);
  return rows[0];
};

// Check if patient exists
exports.patientExists = async (patientId) => {
  const query = `SELECT 1 FROM patients WHERE patient_id = $1`;
  const { rowCount } = await pool.query(query, [patientId]);
  return rowCount > 0;
};

// ============================
// APPOINTMENT CREATION
// ============================

// Insert new appointment (within transaction)
exports.insertAppointment = async (client, data) => {
  const query = `
    INSERT INTO appointments (
      patient_id,
      doctor_id,
      scheduled_start,
      scheduled_end,
      status,
      reason
    )
    VALUES ($1, $2, $3, $4, 'SCHEDULED', $5)
    RETURNING appointment_id
  `;

  const values = [
    data.patient_id,
    data.doctor_id,
    data.scheduled_start,
    data.scheduled_end,
    data.reason
  ];

  const { rows } = await client.query(query, values);
  return rows[0].appointment_id;
};

// ============================
// AVAILABILITY MANAGEMENT
// ============================

// Resolve doctor user_id from doctor_id
exports.getDoctorUserIdByDoctorId = async (doctorId) => {
  const query = "SELECT user_id FROM doctors WHERE doctor_id = $1";
  const { rows } = await pool.query(query, [doctorId]);
  return rows[0];
};

// Insert or update doctor availability
exports.upsertDoctorAvailability = async (
  doctorId,
  dayOfWeek,
  startTime,
  endTime,
  isActive
) => {
  const query = `
    INSERT INTO doctor_availability (doctor_id, day_of_week, start_time, end_time, is_active)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (doctor_id, day_of_week) 
    DO UPDATE SET 
      start_time = EXCLUDED.start_time,
      end_time = EXCLUDED.end_time,
      is_active = EXCLUDED.is_active
  `;
  await pool.query(query, [doctorId, dayOfWeek, startTime, endTime, isActive]);
};

// Get doctor availability
exports.getDoctorAvailability = async (doctorId) => {
  const query = `
    SELECT day_of_week, start_time, end_time, is_active 
    FROM doctor_availability 
    WHERE doctor_id = $1
    ORDER BY day_of_week ASC
  `;
  const { rows } = await pool.query(query, [doctorId]);
  return rows;
};

// ============================
// HELPERS
// ============================

// Resolve doctor_id from user_id
exports.getDoctorIdByUserId = async (userId) => {
  const query = `SELECT doctor_id FROM doctors WHERE user_id = $1`;
  const { rows } = await pool.query(query, [userId]);
  return rows[0];
};

// ============================
// AUDIT LOGGING
// ============================

// Insert audit log entry (transactional)
exports.insertAuditLog = async (client, actorUserId, appointmentId, ip) => {
  const query = `
    INSERT INTO audit_logs (
      actor_user_id,
      action,
      entity_type,
      entity_id,
      ip_address
    )
    VALUES ($1, 'BOOK_APPOINTMENT', 'APPOINTMENT', $2, $3)
  `;
  await client.query(query, [actorUserId, appointmentId, ip]);
};
