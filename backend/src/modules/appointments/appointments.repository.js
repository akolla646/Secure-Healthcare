const pool = require("../../config/db");

/**
 * Check doctor has DOCTOR role
 */

/**
 * Get all appointments for logged-in doctor
 */
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

/**
 * Get all appointments for a patient
 */
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

/**
 * Get patient_id using logged-in user_id
 */
exports.getPatientIdByUserId = async (userId) => {
  const query = `
    SELECT patient_id
    FROM patients
    WHERE user_id = $1
  `;

  const { rows } = await pool.query(query, [userId]);
  return rows[0];
};

exports.isDoctor = async (doctorId) => {
  const query = `
    SELECT 1
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.role_id
    WHERE ur.user_id = (
  SELECT user_id FROM doctors WHERE doctor_id = $1)
      AND r.role_name = 'DOCTOR'
  `;
  const { rowCount } = await pool.query(query, [doctorId]);
  return rowCount > 0;
};

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

/**
 * Check patient exists
 */
exports.patientExists = async (patientId) => {
  const query = `SELECT 1 FROM patients WHERE patient_id = $1`;
  const { rowCount } = await pool.query(query, [patientId]);
  return rowCount > 0;
};

/**
 * Check doctor availability (time window)
 */
exports.isDoctorAvailable = async (
  doctorId,
  dayOfWeek,
  startTime,
  endTime
) => {
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

/**
 * Insert appointment (conflict-safe via DB constraint)
 */
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

/**
 * Write audit log
 */
exports.insertAuditLog = async (
  client,
  actorUserId,
  appointmentId,
  ip
) => {
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
