/**
 * Email Utility (EmailJS Version)
 *
 * Provides OTP email delivery for authentication flows using EmailJS Node.js SDK.
 * This avoids SMTP port blocking issues on cloud providers like Render.
 *
 * Configuration (from .env):
 *   EMAILJS_SERVICE_ID
 *   EMAILJS_TEMPLATE_ID
 *   EMAILJS_PUBLIC_KEY
 *   EMAILJS_PRIVATE_KEY
 *
 * @module utils/email
 */

const emailjs = require("@emailjs/nodejs");

// =============================================================================
// STARTUP CONFIG CHECK
// =============================================================================

if (
  !process.env.EMAILJS_SERVICE_ID ||
  !process.env.EMAILJS_TEMPLATE_ID ||
  !process.env.EMAILJS_PUBLIC_KEY ||
  !process.env.EMAILJS_PRIVATE_KEY
) {
  console.warn("⚠️  EmailJS not fully configured — OTP emails will fail.");
  console.warn("   → Open backend/.env and set all EMAILJS_* variables.");
}

// =============================================================================
// SEND OTP EMAIL
// =============================================================================

/**
 * Send a one-time password to the given email address via EmailJS.
 *
 * @param {string} userEmail - Recipient email
 * @param {string} otp       - 6-digit OTP code
 */
async function sendOTPEmail(userEmail, otp) {
  if (!userEmail) {
    console.error("❌ No email address provided for OTP delivery");
    throw new Error("Email address is required to send OTP");
  }

  const expiryMinutes = process.env.OTP_EXPIRY_MINUTES || 10;

  // Prepare template parameters
  // Ensure these match the {{variable_names}} in your EmailJS template
  const templateParams = {
    user_email: userEmail,
    to_email: userEmail, // Adding this as an alias for better compatibility
    otp: otp,
    expiry_minutes: expiryMinutes,
    reply_to: "no-reply@securehealthcare.com"
  };

  try {
    await emailjs.send(
      process.env.EMAILJS_SERVICE_ID,
      process.env.EMAILJS_TEMPLATE_ID,
      templateParams,
      {
        publicKey: process.env.EMAILJS_PUBLIC_KEY,
        privateKey: process.env.EMAILJS_PRIVATE_KEY,
      }
    );

    const masked = userEmail.replace(/(.{2})(.*)(@.*)/, "$1***$3");
    console.log(`📧 OTP sent successfully to ${masked} (via EmailJS)`);
  } catch (error) {
    console.error(`❌ Failed to send OTP to ${userEmail} via EmailJS:`, error);
    throw new Error("Failed to send OTP email. Please try again later.");
  }
}

module.exports = { sendOTPEmail };
