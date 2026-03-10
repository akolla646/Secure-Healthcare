// ============================================================
// telemedicine.repository.js
// Data Access Layer for the Telemedicine module.
// All direct database queries for sessions and messages are
// centralised here, keeping business logic out of the DB layer.
// ============================================================

const pool = require("../../config/db");

// ------------------------------------------------------------
// getAppointmentDetails
// Fetches a single appointment along with the user_ids of the
// doctor and patient associated with it.
// This is used to:
//   1. Verify the appointment exists before creating a session.
//   2. Resolve doctor_id / patient_id from the appointment.
// ------------------------------------------------------------
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
  return rows[0]; // Returns undefined if not found
};

// ------------------------------------------------------------
// createSession
// Inserts a new telemedicine session into the DB.
// Status starts as 'WAITING' (doctor has not yet joined).
// started_at is set immediately on creation.
// ------------------------------------------------------------
exports.createSession = async (appointmentId, doctorId, patientId) => {
  const query = `
    INSERT INTO telemedicine_sessions (appointment_id, doctor_id, patient_id, status, started_at)
    VALUES ($1, $2, $3, 'WAITING', CURRENT_TIMESTAMP)
    RETURNING *
  `;
  const { rows } = await pool.query(query, [appointmentId, doctorId, patientId]);
  return rows[0]; // Returns the newly created session row
};

// ------------------------------------------------------------
// getSessionById
// Looks up a telemedicine session by its UUID primary key.
// Used by the socket layer and controller to validate sessions
// before authorising participants.
// ------------------------------------------------------------
exports.getSessionById = async (sessionId) => {
  const query = `
    SELECT * FROM telemedicine_sessions
    WHERE session_id = $1
  `;
  const { rows } = await pool.query(query, [sessionId]);
  return rows[0];
};

// ------------------------------------------------------------
// getSessionByParticipants
// Retrieves the most recent shared session for a given
// doctor-patient pair (ordered by started_at DESC, LIMIT 1).
//
// Key design decision: one shared chat thread per doctor-patient
// pair, not one per appointment. This means the conversation
// history persists across multiple appointments.
// ------------------------------------------------------------
exports.getSessionByParticipants = async (doctorId, patientId) => {
  const query = `
    SELECT * FROM telemedicine_sessions
    WHERE doctor_id = $1 AND patient_id = $2
    ORDER BY started_at DESC LIMIT 1
  `;
  const { rows } = await pool.query(query, [doctorId, patientId]);
  return rows[0];
};

// ------------------------------------------------------------
// getPastAppointmentsCount
// Counts appointments between this doctor-patient pair where
// scheduled_end is in the past (i.e., completed appointments).
//
// Used as a gate to unlock chat: the pair must have completed
// at least one appointment before the text chat is enabled.
// ------------------------------------------------------------
exports.getPastAppointmentsCount = async (doctorId, patientId) => {
  const query = `
    SELECT COUNT(*) AS past_count
    FROM appointments a
    WHERE a.doctor_id = (SELECT doctor_id FROM doctors WHERE user_id = $1)
      AND a.patient_id = (SELECT patient_id FROM patients WHERE user_id = $2)
      AND a.scheduled_end <= CURRENT_TIMESTAMP
  `;
  const { rows } = await pool.query(query, [doctorId, patientId]);
  return parseInt(rows[0].past_count, 10); // Return as integer (not string)
};

// ------------------------------------------------------------
// getMessagesBySession
// Fetches all messages for a session in chronological order
// (oldest first) so the UI renders a natural chat history.
// ------------------------------------------------------------
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

// ------------------------------------------------------------
// createMessage
// Inserts a new message into the telemedicine_messages table.
// is_read defaults to FALSE in the DB schema.
// Returns the full inserted row so the socket can broadcast it.
// ------------------------------------------------------------
exports.createMessage = async (sessionId, senderId, messageText) => {
  const query = `
    INSERT INTO telemedicine_messages (session_id, sender_id, message_text)
    VALUES ($1, $2, $3)
    RETURNING *
  `;
  const { rows } = await pool.query(query, [sessionId, senderId, messageText]);
  return rows[0];
};

// ------------------------------------------------------------
// markMessagesAsRead
// Updates is_read = TRUE for messages in a session that were
// sent by the OTHER person (sender_id != receiverId) and are
// still unread. Called when the other party receives a message.
// ------------------------------------------------------------
exports.markMessagesAsRead = async (sessionId, receiverId) => {
  const query = `
    UPDATE telemedicine_messages
    SET is_read = TRUE
    WHERE session_id = $1 AND sender_id != $2 AND is_read = FALSE
  `;
  await pool.query(query, [sessionId, receiverId]);
};

// ------------------------------------------------------------
// endSession
// Marks a session as ENDED and records the ended_at timestamp.
// The WHERE clause checks status != 'ENDED' to prevent double-
// ending a session (idempotent guard).
// Returns the updated row, or undefined if already ended.
// ------------------------------------------------------------
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
