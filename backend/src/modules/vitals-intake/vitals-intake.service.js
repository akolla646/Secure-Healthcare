/**
 * Vitals Intake Service
 * 
 * Contains business logic and validation for the Sprint 2 vitals-intake module.
 * Validates incoming data types before persisting to the database.
 * 
 * @module modules/vitals-intake/service
 */

const repo = require("./vitals-intake.repository");

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

/**
 * UUID v4 format regex for validation
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Validate vitals data types
 * 
 * Ensures all fields conform to expected types before database insertion.
 * 
 * @param {Object} data - Raw vitals data from the request body
 * @returns {Object} Validated and sanitized data
 * @throws {Error} 400 if any validation fails
 */
function validateVitalsData(data) {
    const errors = [];

    // patient_id: required UUID
    if (!data.patient_id || !UUID_REGEX.test(data.patient_id)) {
        errors.push("patient_id must be a valid UUID");
    }

    // heart_rate: must be an integer
    if (data.heart_rate !== undefined && data.heart_rate !== null) {
        const hr = Number(data.heart_rate);
        if (!Number.isInteger(hr) || hr < 0 || hr > 300) {
            errors.push("heart_rate must be an integer between 0 and 300");
        }
    }

    // blood_pressure: must be a string (e.g., "120/80")
    if (data.blood_pressure !== undefined && data.blood_pressure !== null) {
        if (typeof data.blood_pressure !== "string" || data.blood_pressure.trim() === "") {
            errors.push("blood_pressure must be a non-empty string (e.g., '120/80')");
        }
    }

    // temperature: must be a number (decimal)
    if (data.temperature !== undefined && data.temperature !== null) {
        const temp = Number(data.temperature);
        if (isNaN(temp) || temp < 25 || temp > 50) {
            errors.push("temperature must be a number between 25 and 50");
        }
    }

    // spo2: must be an integer percentage
    if (data.spo2 !== undefined && data.spo2 !== null) {
        const sp = Number(data.spo2);
        if (!Number.isInteger(sp) || sp < 0 || sp > 100) {
            errors.push("spo2 must be an integer between 0 and 100");
        }
    }

    if (errors.length > 0) {
        const err = new Error(errors.join("; "));
        err.status = 400;
        throw err;
    }

    // Return sanitized data with proper types
    return {
        patient_id: data.patient_id,
        heart_rate: data.heart_rate != null ? Number(data.heart_rate) : null,
        blood_pressure: data.blood_pressure || null,
        temperature: data.temperature != null ? Number(data.temperature) : null,
        spo2: data.spo2 != null ? Number(data.spo2) : null,
    };
}

// =============================================================================
// SERVICE METHODS
// =============================================================================

/**
 * Create a new vital signs record
 * 
 * Validates all incoming data types and stores the record in the database.
 * 
 * @param {Object} data - Vitals data from request body
 * @returns {Object} Created vital record with id and timestamp
 * @throws {Error} 400 if validation fails
 */
exports.createVital = async (data) => {
    const validated = validateVitalsData(data);
    const result = await repo.insertVital(validated);
    return result;
};

/**
 * Get all vitals for a specific patient
 * 
 * Validates the patient ID format and retrieves all vitals history.
 * 
 * @param {string} patientId - Patient UUID
 * @returns {Object} Object with patient_id and vitals array
 * @throws {Error} 400 if patient_id is not a valid UUID
 */
exports.getPatientVitals = async (patientId) => {
    if (!patientId || !UUID_REGEX.test(patientId)) {
        const err = new Error("patientId must be a valid UUID");
        err.status = 400;
        throw err;
    }

    const vitals = await repo.getVitalsByPatientId(patientId);
    return {
        patient_id: patientId,
        vitals,
    };
};
