/**
 * Email Service Utility
 * 
 * This module handles sending emails (specifically OTPs) using the EmailJS library.
 * It abstracts the EmailJS configuration and sending logic.
 */

import emailjs from '@emailjs/browser';

// EMAILJS CONFIGURATION
// Keys should ideally be in environment variables (e.g., VITE_EMAILJS_PUBLIC_KEY)
const EMAILJS_SERVICE_ID = "service_q0ew1ht";
const EMAILJS_TEMPLATE_ID = "template_agobg2n";
const EMAILJS_PUBLIC_KEY = "AjjELeucm-wEo7cwh";

/**
 * Initializes the EmailJS SDK.
 * Should be called once, typically at app startup (e.g., in Login or Register components).
 */
export const initEmailJS = () => {
    emailjs.init(EMAILJS_PUBLIC_KEY);
};

/**
 * Sends an OTP email to the user.
 * 
 * @param {string} email - Recipient's email address
 * @param {string} otp - The One-Time Password to send
 * @param {string} name - Recipient's name (default: "User")
 * @returns {Promise<Object>} - Returns { success: true } or { success: false, error: ... }
 */
export const sendOtpEmail = async (email, otp, name = "User") => {
    try {
        // Parameters must match the variables defined in your EmailJS template
        const templateParams = {
            to_email: email,
            to_name: name,
            passcode: otp,
            message: `Your One-Time Password is: ${otp}. It expires in 5 minutes.`,
        };

        // Send email using EmailJS
        const response = await emailjs.send(
            EMAILJS_SERVICE_ID,
            EMAILJS_TEMPLATE_ID,
            templateParams,
            EMAILJS_PUBLIC_KEY
        );

        console.log('EmailJS Success:', response.status, response.text);
        return { success: true };
    } catch (error) {
        console.error('EmailJS Failed Details:', JSON.stringify(error));
        if (error.text) console.error('EmailJS Error Text:', error.text);
        return { success: false, error: error };
    }
};
