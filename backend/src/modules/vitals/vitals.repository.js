const pool = require("../../config/db");

// Check if user is doctor or nurse
exports.isClinician = async (userId) => {
  const query = `
    SELECT 1
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.role_id
    WHERE ur.user_id = $1
      AND r.role_name IN ('DOCTOR', 'NURSE')
  `;
  const { rowCount } = await pool.query(query, [userId]);
  return rowCount > 0;
};

// Get appointment
exports.getAppointment = async (appointmentId) => {
  const query = `
    SELECT appointment_id, patient_id, status
    FROM appointments
    WHERE appointment_id = $1
  `;
  const { rows } = await pool.query(query, [appointmentId]);
  return rows[0];
};

// Insert vitals
exports.insertVitals = async (client, data) => {
  const query = `
    INSERT INTO vital_signs (
      appointment_id,
      patient_id,
      taken_by,
      heart_rate,
      bp_systolic,
      bp_diastolic,
      temperature,
      respiratory_rate,
      oxygen_saturation
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    RETURNING vital_id
  `;

  const values = [
    data.appointment_id,
    data.patient_id,
    data.recorded_by,
    data.heart_rate,
    data.bp_systolic,
    data.bp_diastolic,
    data.temperature,
    data.respiratory_rate,
    data.oxygen_saturation
  ];

  const { rows } = await client.query(query, values);
  return rows[0].vital_id;
};

// Get vitals for an appointment
exports.getAppointmentVitals = async (appointmentId) => {
  const query = `
    SELECT
      vital_id,
      heart_rate,
      bp_systolic,
      bp_diastolic,
      temperature,
      respiratory_rate,
      oxygen_saturation,
      recorded_at
    FROM vital_signs
    WHERE appointment_id = $1
    ORDER BY recorded_at DESC
  `;
  const { rows } = await pool.query(query, [appointmentId]);
  return rows;
};

// Get vitals for a patient
exports.getPatientVitals = async (patientId) => {
  const query = `
    SELECT
      v.vital_id,
      v.heart_rate,
      v.bp_systolic,
      v.bp_diastolic,
      v.temperature,
      v.respiratory_rate,
      v.oxygen_saturation,
      v.recorded_at,
      v.appointment_id
    FROM vital_signs v
    WHERE v.patient_id = $1
    ORDER BY v.recorded_at DESC
  `;
  const { rows } = await pool.query(query, [patientId]);
  return rows;
};

// Audit log
exports.insertAudit = async (client, actorUserId, vitalId) => {
  const query = `
    INSERT INTO audit_logs (
      actor_user_id,
      action,
      entity_type,
      entity_id
    )
    VALUES ($1, 'RECORD_VITALS', 'VITAL_SIGNS', $2)
  `;
  await client.query(query, [actorUserId, vitalId]);
};
