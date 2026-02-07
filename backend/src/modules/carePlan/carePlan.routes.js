/**
 * Care Plan Routes
 * Endpoints for generating care/diet plans from diagnosis files
 */

const express = require('express');
const router = express.Router();
const { generateCarePlan, getSupportedDiagnoses } = require('./carePlan.controller');
const { authenticateToken } = require('../../middleware/auth.middleware');

// Generate care plan from diagnosis text (requires authentication)
router.post('/generate', authenticateToken, generateCarePlan);

// Get list of supported diagnoses
router.get('/diagnoses', getSupportedDiagnoses);

module.exports = router;
