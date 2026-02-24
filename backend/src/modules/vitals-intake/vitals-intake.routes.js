/**
 * Vitals Intake Routes
 * 
 * Defines Sprint 2 API endpoints for recording and retrieving patient
 * vital signs. Mounted at /api/vitals in app.js.
 * 
 * Endpoints:
 *   POST /api/vitals          - Store new vital signs
 *   GET  /api/vitals/:patientId - Retrieve vitals history for a patient
 * 
 * @module modules/vitals-intake/routes
 */

const express = require("express");
const router = express.Router();
const controller = require("./vitals-intake.controller");

// =============================================================================
// VITAL SIGNS STORAGE
// =============================================================================

/**
 * Store Patient Vital Signs
 * POST /api/vitals
 * 
 * @body {string} patient_id - UUID of the patient
 * @body {number} heart_rate - Heart rate in bpm (integer)
 * @body {string} blood_pressure - Blood pressure as text (e.g., "120/80")
 * @body {number} temperature - Body temperature (decimal)
 * @body {number} spo2 - Oxygen saturation percentage (integer)
 */
router.post("/", controller.postVitals);

// =============================================================================
// VITAL SIGNS RETRIEVAL
// =============================================================================

/**
 * Retrieve Patient Vital Signs History
 * GET /api/vitals/:patientId
 * 
 * @param {string} patientId - Patient UUID (URL param)
 * @returns {Object} Object with patient_id and vitals array
 */
router.get("/:patientId", controller.getVitals);

module.exports = router;
