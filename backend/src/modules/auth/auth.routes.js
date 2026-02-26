/**
 * Authentication Routes
 * Defines login, registration, MFA, password reset, and admin endpoints.
 */

const express = require("express");
const router = express.Router();
const controller = require("./auth.controller");

const { authenticate } = require("../../middleware/auth.middleware");
const { authorize } = require("../../middleware/role.middleware");

// ============================
// AUTHENTICATION
// ============================

// Login (step 1 - password check)
router.post("/login", controller.login);

// Verify login OTP (step 2 - MFA)
router.post("/login/verify-otp", controller.verifyLoginOTP);

// Resend OTP
router.post("/resend-otp", controller.resendOtp);

// Logout (audit logged)
router.post("/logout", authenticate, controller.logout);

// ============================
// REGISTRATION
// ============================

// Public registration (patients only)
router.post("/register", controller.publicRegister);

// Activate account via OTP
router.post("/activate", controller.activateAccount);

// ============================
// PASSWORD RESET
// ============================

// Request password reset (send OTP)
router.post("/forgot-password", controller.forgotPassword);

// Reset password with OTP
router.post("/reset-password", controller.resetPassword);

// ============================
// KEY MANAGEMENT
// ============================

// Generate RSA key pair (protected)
router.post("/generate-keys", authenticate, controller.generateKeys);

// ============================
// ADMIN OPERATIONS
// ============================

// Admin create user
router.post(
  "/admin/create-user",
  authenticate,
  authorize(["ADMIN"]),
  controller.adminCreateUser
);

module.exports = router;
