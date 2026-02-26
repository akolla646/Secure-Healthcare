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
 * @route POST /telemedicine/session
 * @desc Create a new telemedicine session
 * @access Doctor only
 */
router.post(
    "/session",
    checkAuth,
    checkRole("DOCTOR"),
    telemedicineController.createSession
);

/**
 * @route GET /telemedicine/session/:sessionId
 * @desc Get session details
 * @access Doctor or Patient (participants only)
 */
router.get(
    "/session/:sessionId",
    checkAuth,
    telemedicineController.getSession
);

/**
 * @route GET /telemedicine/messages/:sessionId
 * @desc Get all messages for a session
 * @access Doctor or Patient (participants only)
 */
router.get(
    "/messages/:sessionId",
    checkAuth,
    telemedicineController.getMessages
);

/**
 * @route GET /telemedicine/appointment/:appointmentId
 * @desc Get session details by appointment ID
 * @access Doctor or Patient
 */
router.get(
    "/appointment/:appointmentId",
    checkAuth,
    telemedicineController.getSessionByAppointmentId
);

module.exports = router;
