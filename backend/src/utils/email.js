/**
 * Email Utility (EmailJS Backend Integration)
 *
 * Provides OTP email delivery for authentication flows (login MFA,
 * registration, password reset, and account activation) directly from the backend.
 *
 * Configuration (from backend/.env):
 *   EMAILJS_SERVICE_ID   — Your EmailJS Service ID (e.g. service_xxxx)
 *   EMAILJS_TEMPLATE_ID  — Your EmailJS Template ID (e.g. template_xxxx)
 *   EMAILJS_PUBLIC_KEY   — Your EmailJS Public Key
 *   EMAILJS_PRIVATE_KEY  — Your EmailJS Private Key (Dashboard > Account > API Keys)
 *   OTP_EXPIRY_MINUTES   — (Optional) Defaults to 10
 *
 * @module utils/email
 */

const emailjs = require('@emailjs/nodejs');

// =============================================================================
// STARTUP CONFIG CHECK
// =============================================================================

if (
  !process.env.EMAILJS_SERVICE_ID ||
  !process.env.EMAILJS_TEMPLATE_ID ||
  !process.env.EMAILJS_PUBLIC_KEY ||
  !process.env.EMAILJS_PRIVATE_KEY
) {
  console.warn("⚠️  EmailJS not fully configured in backend/.env — OTP emails will fail.");
  console.warn("   → Please ensure you have set:");
  console.warn("     EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, EMAILJS_PUBLIC_KEY, and EMAILJS_PRIVATE_KEY");
}

// =============================================================================
// SEND OTP EMAIL
// =============================================================================

/**
 * Send a one-time password to the given email address using EmailJS NodeJS SDK.
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

  try {
    const templateParams = {
      to_email: userEmail,
      to_name: userEmail.split('@')[0], // Simple fallback for name
      passcode: otp,
      otp: otp,
      OTP: otp,
      message: `Your One-Time Password is: ${otp}. It expires in ${expiryMinutes} minutes. If you did not request this, please ignore this email.`,
    };

    const response = await emailjs.send(
      process.env.EMAILJS_SERVICE_ID,
      process.env.EMAILJS_TEMPLATE_ID,
      templateParams,
      {
        publicKey: process.env.EMAILJS_PUBLIC_KEY,
        privateKey: process.env.EMAILJS_PRIVATE_KEY,
      }
    );

    const masked = userEmail.replace(/(.{2})(.*)(@.*)/, "$1***$3");
    console.log(`📧 OTP sent successfully via EmailJS to ${masked}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send OTP via EmailJS to ${userEmail}:`, error);
    throw new Error("Failed to send OTP email. Please try again later.");
  }
}

module.exports = { sendOTPEmail };
