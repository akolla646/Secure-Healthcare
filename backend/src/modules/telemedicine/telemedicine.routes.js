// ============================================================
// telemedicine.routes.js
// API Route Definitions for the Telemedicine module.
// Base path: /telemedicine  (mounted in app.js / server.js)
//
// Middleware applied:
//   - checkAuth  : Verifies JWT and populates req.user
//   - checkRole  : Restricts endpoint to specific user roles
// ============================================================

const express = require("express");
const router = express.Router();
const { authenticate: checkAuth } = require("../../middleware/auth.middleware");
const { authorize: checkRole } = require("../../middleware/role.middleware");
const telemedicineController = require("./telemedicine.controller");

// ==========================================
// TELEMEDICINE ROUTES
// BASE PATH: /telemedicine
// ==========================================

/**
 * @route  POST /telemedicine/session
 * @desc   Create (or retrieve existing) telemedicine session for an appointment.
 *         Implements the "one session per doctor-patient pair" design —
 *         if a session already exists for this pair, it is returned rather
 *         than creating a duplicate.
 * @access DOCTOR only
 * @body   { appointmentId: UUID }
 */
router.post(
    "/session",
    checkAuth,                     // Must be logged in
    checkRole("DOCTOR"),           // Only doctors can initiate sessions
    telemedicineController.createSession
);

/**
 * @route  GET /telemedicine/session/:sessionId
 * @desc   Fetch session details by session UUID.
 *         Used by the chat component after session_id is known.
 * @access Doctor or Patient (only participants)
 * @params sessionId - UUID of the telemedicine session
 */
router.get(
    "/session/:sessionId",
    checkAuth,                     // Must be logged in; role check done in controller
    telemedicineController.getSession
);

/**
 * @route  GET /telemedicine/messages/:sessionId
 * @desc   Fetch complete message history for a session in chronological order.
 *         Called once on page load; subsequent messages arrive via Socket.IO.
 * @access Doctor or Patient (only participants)
 * @params sessionId - UUID of the telemedicine session
 */
router.get(
    "/messages/:sessionId",
    checkAuth,
    telemedicineController.getMessages
);

/**
 * @route  GET /telemedicine/appointment/:appointmentId
 * @desc   Entry point for the TelemedicinePage — resolves session, appointment
 *         timing details, and chat-unlock status from an appointment ID alone.
 *         Returns: { session, appointment, hasPastAppointments }
 * @access Doctor or Patient
 * @params appointmentId - UUID of the appointment
 */
router.get(
    "/appointment/:appointmentId",
    checkAuth,
    telemedicineController.getSessionByAppointmentId
);

module.exports = router;
