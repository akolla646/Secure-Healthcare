const express = require("express");
const router = express.Router();
const controller = require("./vitals.controller");

// Record vitals
router.post("/", controller.recordVitals);

// View my vitals (Patient)
const { authenticate } = require("../../middleware/auth.middleware");
const { authorize } = require("../../middleware/role.middleware");

router.get(
  "/my-vitals",
  authenticate,
  authorize("PATIENT"),
  controller.getMyVitals
);

// View vitals by appointment
router.get(
  "/appointments/:appointment_id/vitals",
  controller.getVitalsByAppointment
);

// View vitals by patient
router.get(
  "/patients/:patient_id/vitals",
  controller.getVitalsByPatient
);

module.exports = router;
