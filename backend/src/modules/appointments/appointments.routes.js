/**
 * Appointments Routes
 * Defines appointment-related API endpoints.
 */

const express = require('express');
const router = express.Router();
const controller = require('./appointments.controller');

const { authenticate } = require("../../middleware/auth.middleware");
const { authorize } = require("../../middleware/role.middleware");

// ============================
// PATIENT ROUTES
// ============================

// Book appointment
router.post(
  "/",
  authenticate,
  authorize("PATIENT"),
  controller.bookAppointment
);

// Get patient's appointments
router.get(
  "/my-appointments",
  authenticate,
  authorize("PATIENT"),
  controller.getMyAppointments
);

// ============================
// DOCTOR ROUTES
// ============================

// Get doctor's appointments
router.get(
  "/doctor",
  authenticate,
  authorize("DOCTOR"),
  controller.getDoctorAppointments
);

// Update availability
router.post(
  "/availability",
  authenticate,
  authorize("DOCTOR"),
  controller.updateAvailability
);

// Get availability
router.get(
  "/availability",
  authenticate,
  authorize("DOCTOR"),
  controller.getAvailability
);

module.exports = router;
