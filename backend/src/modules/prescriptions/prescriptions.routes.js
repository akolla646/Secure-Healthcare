const express = require("express");
const router = express.Router();
const controller = require("./prescriptions.controller");

// Doctor creates prescription
router.post("/", controller.createPrescription);

// View prescriptions by appointment
router.get(
  "/appointments/:appointment_id/prescriptions",
  controller.getByAppointment
);

// View prescriptions by patient
router.get(
  "/patients/:patient_id/prescriptions",
  controller.getByPatient
);

module.exports = router;
