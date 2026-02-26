/**
 * Doctors Routes
 * 
 * This module defines API endpoints for doctor-related operations.
 * Currently provides a listing of active doctors for use in appointment
 * booking and patient assignment features.
 * 
 * @module modules/doctors/routes
 */

const express = require("express");
const router = express.Router();

// Controller containing route handlers
const controller = require("./doctors.controller");

// Authentication middleware
const { authenticate } = require("../../middleware/auth.middleware");

// =============================================================================
// ENDPOINTS
// =============================================================================

/**
 * Get All Active Doctors
 * GET /doctors/
 * 
 * @requires Authentication - Valid JWT token required
 * 
 * @returns {Array} List of doctors with doctor_id, full_name, and specialization
 */
router.get("/", authenticate, controller.getAllDoctors);

module.exports = router;
