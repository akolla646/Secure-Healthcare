/**
 * Vitals Intake Controller
 * 
 * Handles HTTP request/response logic for the Sprint 2 vitals-intake module.
 * Delegates business logic to the service layer.
 * 
 * @module modules/vitals-intake/controller
 */

const vitalsIntakeService = require("./vitals-intake.service");

// =============================================================================
// POST OPERATIONS
// =============================================================================

/**
 * Store Patient Vital Signs
 * 
 * Handles POST /api/vitals
 * Validates and stores a new vital signs record.
 * 
 * @param {Object} req - Express request object
 * @param {Object} req.body - Vitals data (patient_id, heart_rate, blood_pressure, temperature, spo2)
 * @param {Object} res - Express response object
 */
exports.postVitals = async (req, res) => {
    try {
        const result = await vitalsIntakeService.createVital(req.body);

        res.status(201).json({
            success: true,
            message: "Vital signs recorded successfully",
            data: result,
        });
    } catch (err) {
        res.status(err.status || 500).json({
            success: false,
            error: err.message,
        });
    }
};

// =============================================================================
// GET OPERATIONS
// =============================================================================

/**
 * Retrieve Patient Vital Signs History
 * 
 * Handles GET /api/vitals/:patientId
 * Returns all stored vitals for a patient, ordered by most recent first.
 * 
 * @param {Object} req - Express request object
 * @param {string} req.params.patientId - Patient UUID
 * @param {Object} res - Express response object
 */
exports.getVitals = async (req, res) => {
    try {
        const result = await vitalsIntakeService.getPatientVitals(
            req.params.patientId
        );

        res.status(200).json({
            success: true,
            data: result,
        });
    } catch (err) {
        res.status(err.status || 500).json({
            success: false,
            error: err.message,
        });
    }
};
