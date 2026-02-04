const pool = require("../../config/db");

exports.isDoctor = async (userId) => {
  const q = `
    SELECT 1
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.role_id
    WHERE ur.user_id = $1 AND r.role_name = 'DOCTOR'
  `;
  const { rowCount } = await pool.query(q, [userId]);
  return rowCount > 0;
};

exports.getAppointment = async (appointmentId) => {
  const q = `
    SELECT appointment_id, patient_id, doctor_id, status
    FROM appointments
    WHERE appointment_id = $1
  `;
  const { rows } = await pool.query(q, [appointmentId]);
  return rows[0];
};

exports.insertPrescription = async (client, data) => {
  const q = `
    INSERT INTO prescriptions (
      appointment_id,
      patient_id,
      doctor_id,
      medication_id,
      dosage,
      frequency,
      start_date,
      end_date,
      is_active
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,TRUE)
    RETURNING prescription_id
  `;
  const values = [
    data.appointment_id,
    data.patient_id,
    data.doctor_id,
    data.medication_id,
    data.dosage,
    data.frequency,
    data.start_date,
    data.end_date
  ];
  const { rows } = await client.query(q, values);
  return rows[0].prescription_id;
};

exports.getByAppointment = async (appointmentId) => {
  const q = `
    SELECT *
    FROM prescriptions
    WHERE appointment_id = $1
    ORDER BY start_date DESC
  `;
  const { rows } = await pool.query(q, [appointmentId]);
  return rows;
};

exports.getByPatient = async (patientId) => {
  const q = `
    SELECT *
    FROM prescriptions
    WHERE patient_id = $1
    ORDER BY start_date DESC
  `;
  const { rows } = await pool.query(q, [patientId]);
  return rows;
};

exports.insertAudit = async (client, actorId, prescriptionId) => {
  const q = `
    INSERT INTO audit_logs (
      actor_user_id,
      action,
      entity_type,
      entity_id
    )
    VALUES ($1, 'CREATE_PRESCRIPTION', 'PRESCRIPTION', $2)
  `;
  await client.query(q, [actorId, prescriptionId]);
};
