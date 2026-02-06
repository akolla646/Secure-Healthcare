const express = require("express");
const router = express.Router();
const controller = require("./doctors.controller");
const { authenticate } = require("../../middleware/auth.middleware");

// Public or Authenticated? Authenticated seems safer but Public is OK for registration dropdowns too if needed.
// For booking, user is logged in.
router.get("/", authenticate, controller.getAllDoctors);

module.exports = router;
