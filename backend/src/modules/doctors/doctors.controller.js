/**
 * Doctors Controller
 * Handles doctor-related HTTP requests.
 */

const service = require("./doctors.service");

// ============================
// ENDPOINTS
// ============================

// GET /doctors/ - Get all active doctors
exports.getAllDoctors = async (req, res) => {
    try {
        const doctors = await service.getAllDoctors();
        res.json(doctors);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
