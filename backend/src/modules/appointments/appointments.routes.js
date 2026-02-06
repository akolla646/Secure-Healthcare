const express = require('express');
const router = express.Router();
const controller = require('./appointments.controller');

const { authenticate } = require("../../middleware/auth.middleware");
const { authorize } = require("../../middleware/role.middleware");

router.post(
  "/",
  authenticate,
  authorize("PATIENT"),
  controller.bookAppointment
);

router.get(
  "/my-appointments",
  authenticate,
  authorize("PATIENT"),
  controller.getMyAppointments
);

router.get(
  "/doctor",
  authenticate,
  authorize("DOCTOR"),
  controller.getDoctorAppointments
);

module.exports = router;
