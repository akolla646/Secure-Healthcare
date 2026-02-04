const express = require("express");
const router = express.Router();
const controller = require("./patient.controller");

const { authenticate } = require("../../middleware/auth.middleware");
const { authorize } = require("../../middleware/role.middleware");

// CREATE PATIENT
router.post(
  "/",
  authenticate,
  authorize("ADMIN", "DOCTOR"),
  controller.createPatient
);

router.post(
  "/register",
  authenticate,
  authorize("ADMIN", "DOCTOR"),
  controller.registerPatientWithUser
);

// GET ALL PATIENTS
router.get(
  "/",
  authenticate,
  authorize("ADMIN", "DOCTOR", "NURSE"),
  controller.getAll
);

module.exports = router;
