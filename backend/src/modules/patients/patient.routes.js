/**
 * Patient Routes
 * Defines API endpoints for patient management.
 */

const express = require("express");
const router = express.Router();
const controller = require("./patient.controller");

const { authenticate } = require("../../middleware/auth.middleware");
const { authorize } = require("../../middleware/role.middleware");

// ============================
// PATIENT CREATION
// ============================

// Create patient (no user account)
router.post(
  "/",
  authenticate,
  authorize("ADMIN", "DOCTOR"),
  controller.createPatient
);

// Register patient (with user account)
router.post(
  "/register",
  authenticate,
  authorize("ADMIN", "DOCTOR"),
  controller.registerPatientWithUser
);

// ============================
// PATIENT LISTING
// ============================

// Get all patients
router.get(
  "/",
  authenticate,
  authorize("ADMIN", "DOCTOR", "NURSE"),
  controller.getAll
);

// ============================
// DATA PRIVACY (GDPR)
// ============================

// Request Data Erasure
router.delete(
  "/me/erasure",
  authenticate,
  authorize("PATIENT"), // Only patients can request their own data erasure in this context
  controller.requestDataErasure
);

module.exports = router;
