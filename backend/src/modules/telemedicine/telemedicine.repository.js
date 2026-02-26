const pool = require("../../config/db");

// Retrieve an appointment and its associated users (doctor and patient)
exports.getAppointmentDetails = async (appointmentId) => {
  const query = `
    SELECT 
      a.appointment_id,
      a.scheduled_start,
      a.scheduled_end,
      d.user_id AS doctor_user_id,
      p.user_id AS patient_user_id
    FROM appointments a
    JOIN doctors d ON a.doctor_id = d.doctor_id
    JOIN patients p ON a.patient_id = p.patient_id
    WHERE a.appointment_id = $1
  `;
  const { rows } = await pool.query(query, [appointmentId]);
  return rows[0];
};

exports.createSession = async (appointmentId, doctorId, patientId) => {
  const query = `
    INSERT INTO telemedicine_sessions (appointment_id, doctor_id, patient_id, status, started_at)
    VALUES ($1, $2, $3, 'WAITING', CURRENT_TIMESTAMP)
    RETURNING *
  `;
  const { rows } = await pool.query(query, [appointmentId, doctorId, patientId]);
  return rows[0];
};

exports.getSessionById = async (sessionId) => {
  const query = `
    SELECT * FROM telemedicine_sessions
    WHERE session_id = $1
  `;
  const { rows } = await pool.query(query, [sessionId]);
  return rows[0];
};

// Retrieve the latest shared session between a specific doctor and patient pair
exports.getSessionByParticipants = async (doctorId, patientId) => {
  const query = `
    SELECT * FROM telemedicine_sessions
    WHERE doctor_id = $1 AND patient_id = $2
    ORDER BY started_at DESC LIMIT 1
  `;
  const { rows } = await pool.query(query, [doctorId, patientId]);
  return rows[0];
};

// Check if the doctor and patient have completed at least one appointment in the past
// Used to verify if they are allowed to use the text chat feature.
exports.getPastAppointmentsCount = async (doctorId, patientId) => {
  const query = `
    SELECT COUNT(*) AS past_count
    FROM appointments a
    WHERE a.doctor_id = (SELECT doctor_id FROM doctors WHERE user_id = $1)
      AND a.patient_id = (SELECT patient_id FROM patients WHERE user_id = $2)
      AND a.scheduled_end <= CURRENT_TIMESTAMP
  `;
  const { rows } = await pool.query(query, [doctorId, patientId]);
  return parseInt(rows[0].past_count, 10);
};

exports.getMessagesBySession = async (sessionId) => {
  const query = `
    SELECT 
      message_id, session_id, sender_id, message_text, is_read, sent_at
    FROM telemedicine_messages
    WHERE session_id = $1
    ORDER BY sent_at ASC
  `;
  const { rows } = await pool.query(query, [sessionId]);
  return rows;
};

exports.createMessage = async (sessionId, senderId, messageText) => {
  const query = `
    INSERT INTO telemedicine_messages (session_id, sender_id, message_text)
    VALUES ($1, $2, $3)
    RETURNING *
  `;
  const { rows } = await pool.query(query, [sessionId, senderId, messageText]);
  return rows[0];
};

exports.markMessagesAsRead = async (sessionId, receiverId) => {
  const query = `
    UPDATE telemedicine_messages
    SET is_read = TRUE
    WHERE session_id = $1 AND sender_id != $2 AND is_read = FALSE
  `;
  await pool.query(query, [sessionId, receiverId]);
};

exports.endSession = async (sessionId) => {
  const query = `
    UPDATE telemedicine_sessions
    SET status = 'ENDED', ended_at = CURRENT_TIMESTAMP
    WHERE session_id = $1 AND status != 'ENDED'
    RETURNING *
  `;
  const { rows } = await pool.query(query, [sessionId]);
  return rows[0];
};
