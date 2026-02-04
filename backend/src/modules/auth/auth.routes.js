const express = require("express");
const router = express.Router();
const controller = require("./auth.controller");
const { authenticate } = require("../../middleware/auth.middleware");
const { authorize } = require("../../middleware/role.middleware");

/**
 * AUTHENTICATION
 */

// Step 1: Username + Password → OTP (if MFA enabled)
router.post("/login", controller.login);

// Step 2: Verify OTP → JWT
router.post("/login/verify-otp", controller.verifyLoginOTP);

// Logout (invalidate session / token)
router.post("/logout", authenticate, controller.logout);

// Forgot password → send OTP
router.post("/forgot-password", controller.forgotPassword);

// Reset password using OTP
router.post("/reset-password", controller.resetPassword);

// Generate RSA keys (authenticated users only)
router.post("/generate-keys", authenticate, controller.generateKeys);

/**
 * ADMIN ACTIONS
 */

// Admin creates user and sends activation OTP
router.post(
  "/admin/create-user",
  authenticate,
  authorize(["ADMIN"]),
  controller.adminCreateUser
);

// User activates account using OTP + sets password
router.post("/activate", controller.activateAccount);

module.exports = router;
