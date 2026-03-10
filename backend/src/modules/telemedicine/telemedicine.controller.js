// ============================================================
// telemedicine.controller.js
// Business Logic Layer for the Telemedicine module.
// Handles HTTP request validation, access control, and
// orchestration of repository calls. Never accesses the DB
// directly — all DB operations go through telemedicine.repository.js
// ============================================================

const telemedicineRepo = require("./telemedicine.repository");

// ------------------------------------------------------------
// createSession  [POST /telemedicine/session]
// Access: DOCTOR only (enforced by role middleware on route)
//
// Flow:
//   1. Validate that appointmentId is provided in request body.
//   2. Fetch the appointment and resolve doctor/patient user IDs.
//   3. Verify the requesting user is the doctor or patient.
//   4. Check if a session already exists for this doctor-patient pair.
//   5. If not, create a new session. If yes, return the existing one.
//      → This ensures one shared chat thread per doctor-patient pair.
// ------------------------------------------------------------
exports.createSession = async (req, res) => {
    try {
        const { appointmentId } = req.body;
        const userId = req.user.user_id; // Injected by auth middleware

        // Step 1: Require appointmentId
        if (!appointmentId) {
            return res.status(400).json({ success: false, error: "Missing appointmentId" });
        }

        // Step 2: Resolve appointment and its participants
        const appointment = await telemedicineRepo.getAppointmentDetails(appointmentId);

        if (!appointment) {
            return res.status(404).json({ success: false, error: "Appointment not found" });
        }

        // Step 3: Only the doctor or patient of this appointment can create a session
        if (appointment.doctor_user_id !== userId && appointment.patient_user_id !== userId) {
            return res.status(403).json({ success: false, error: "Unauthorized: Appointment does not belong to you" });
        }

        // Step 4: Look for an existing session between this doctor-patient pair
        let session = await telemedicineRepo.getSessionByParticipants(
            appointment.doctor_user_id,
            appointment.patient_user_id
        );

        // Step 5: Only create a new session if none exists yet for this pair
        if (!session) {
            session = await telemedicineRepo.createSession(
                appointment.appointment_id,
                appointment.doctor_user_id,
                appointment.patient_user_id
            );
        }

        res.status(201).json({ success: true, data: session });
    } catch (error) {
        console.error("Create session error:", error);
        res.status(500).json({ success: false, error: "Failed to create telemedicine session" });
    }
};

// ------------------------------------------------------------
// getSession  [GET /telemedicine/session/:sessionId]
// Access: Doctor or Patient (both must be participants)
//
// Fetches session details by sessionId.
// Checks that the requesting user is a participant.
// ------------------------------------------------------------
exports.getSession = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const userId = req.user.user_id;

        const session = await telemedicineRepo.getSessionById(sessionId);

        // Return 404 if session doesn't exist
        if (!session) {
            return res.status(404).json({ success: false, error: "Session not found" });
        }

        // Only the doctor or patient of the session can view it
        if (session.doctor_id !== userId && session.patient_id !== userId) {
            return res.status(403).json({ success: false, error: "Unauthorized access to session" });
        }

        res.status(200).json({ success: true, data: session });
    } catch (error) {
        console.error("Get session error:", error);
        res.status(500).json({ success: false, error: "Failed to fetch session" });
    }
};

// ------------------------------------------------------------
// getSessionByAppointmentId  [GET /telemedicine/appointment/:appointmentId]
// Access: Doctor or Patient
//
// Used by the frontend when navigating to the telemedicine page
// via an appointment link (before a session_id is known).
//
// Returns three pieces of data needed by the frontend:
//   - session       : existing shared session (or null)
//   - appointment   : appointment timing details (for time gates)
//   - hasPastAppointments : whether chat should be unlocked
// ------------------------------------------------------------
exports.getSessionByAppointmentId = async (req, res) => {
    try {
        const { appointmentId } = req.params;
        const userId = req.user.user_id;

        // Validate appointment exists
        const appointment = await telemedicineRepo.getAppointmentDetails(appointmentId);

        if (!appointment) {
            return res.status(404).json({ success: false, error: "Appointment not found" });
        }

        // Only the doctor or patient of this appointment can proceed
        if (appointment.doctor_user_id !== userId && appointment.patient_user_id !== userId) {
            return res.status(403).json({ success: false, error: "Unauthorized access" });
        }

        // Fetch the shared session for this doctor-patient pair (not per appointment)
        const session = await telemedicineRepo.getSessionByParticipants(
            appointment.doctor_user_id,
            appointment.patient_user_id
        );

        // Count past (concluded) appointments to determine if chat should be unlocked
        // Chat unlocks permanently once the pair has completed at least one appointment
        const pastAppointmentsCount = await telemedicineRepo.getPastAppointmentsCount(
            appointment.doctor_user_id,
            appointment.patient_user_id
        );

        res.status(200).json({
            success: true,
            data: {
                session: session || null,      // null if no session created yet
                appointment,                   // includes scheduled_start / scheduled_end
                hasPastAppointments: pastAppointmentsCount > 0  // boolean flag for UI gate
            }
        });
    } catch (error) {
        console.error("Get session by appointment error:", error);
        res.status(500).json({ success: false, error: "Failed to fetch session" });
    }
};

// ------------------------------------------------------------
// getMessages  [GET /telemedicine/messages/:sessionId]
// Access: Doctor or Patient (participants only)
//
// Returns full message history for a session in ascending time
// order. Used on initial load to populate chat history before
// the socket connection takes over for live updates.
// ------------------------------------------------------------
exports.getMessages = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const userId = req.user.user_id;

        const session = await telemedicineRepo.getSessionById(sessionId);

        // Validate session exists before attempting to fetch messages
        if (!session) {
            return res.status(404).json({ success: false, error: "Session not found" });
        }

        // Restrict message access to session participants only
        if (session.doctor_id !== userId && session.patient_id !== userId) {
            return res.status(403).json({ success: false, error: "Unauthorized access to messages" });
        }

        const messages = await telemedicineRepo.getMessagesBySession(sessionId);
        res.status(200).json({ success: true, data: messages });
    } catch (error) {
        console.error("Get messages error:", error);
        res.status(500).json({ success: false, error: "Failed to fetch messages" });
    }
};
