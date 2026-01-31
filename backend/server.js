/**
 * Clinical Decision Support System - Main Server
 * Express.js backend with care plan generation API
 */

const express = require('express');
const cors = require('cors');

// Import data and logic modules
const { getPatientById, getAllPatients } = require('./data/patientDatabase');
const { getAllDiagnoses } = require('./data/clinicalKnowledgeGraph');
const RuleEngine = require('./logic/ruleEngine');

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Rule Engine
const ruleEngine = new RuleEngine();

// ============================================
// MIDDLEWARE
// ============================================

// CORS configuration for React frontend
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));

// JSON body parsing
app.use(express.json());

/**
 * Audit Logging Middleware
 * Logs every API request for regulatory compliance tracking
 */
const auditLogger = (req, res, next) => {
    const auditEntry = {
        timestamp: new Date().toISOString(),
        requestId: `REQ-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        method: req.method,
        path: req.path,
        body: req.body,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent')
    };

    console.log('\n========================================');
    console.log('📋 AUDIT LOG - Clinical Decision Request');
    console.log('========================================');
    console.log(`🕐 Timestamp: ${auditEntry.timestamp}`);
    console.log(`🔑 Request ID: ${auditEntry.requestId}`);
    console.log(`📡 Method: ${auditEntry.method} ${auditEntry.path}`);
    if (Object.keys(auditEntry.body || {}).length > 0) {
        console.log(`📦 Payload:`, JSON.stringify(auditEntry.body, null, 2));
    }
    console.log('========================================\n');

    // Attach request ID to response for tracking
    res.setHeader('X-Request-ID', auditEntry.requestId);

    // Store audit entry for response logging
    req.auditEntry = auditEntry;

    // Log response when finished
    res.on('finish', () => {
        console.log('\n========================================');
        console.log('✅ AUDIT LOG - Response Sent');
        console.log('========================================');
        console.log(`🔑 Request ID: ${auditEntry.requestId}`);
        console.log(`📊 Status: ${res.statusCode}`);
        console.log(`⏱️  Completed: ${new Date().toISOString()}`);
        console.log('========================================\n');
    });

    next();
};

// Apply audit logging to all routes
app.use(auditLogger);

// ============================================
// API ROUTES
// ============================================

/**
 * GET /api/health
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'Clinical Decision Support System',
        version: '1.0.0',
        timestamp: new Date().toISOString()
    });
});

/**
 * GET /api/patients
 * Get list of all patients for dropdown selection
 */
app.get('/api/patients', (req, res) => {
    try {
        const patients = getAllPatients();
        res.json({
            success: true,
            data: patients
        });
    } catch (error) {
        console.error('Error fetching patients:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch patients'
        });
    }
});

/**
 * GET /api/patients/:patientId
 * Get detailed patient information
 */
app.get('/api/patients/:patientId', (req, res) => {
    try {
        const { patientId } = req.params;
        const patient = getPatientById(patientId);

        if (!patient) {
            return res.status(404).json({
                success: false,
                error: `Patient not found: ${patientId}`
            });
        }

        res.json({
            success: true,
            data: patient
        });
    } catch (error) {
        console.error('Error fetching patient:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch patient data'
        });
    }
});

/**
 * GET /api/diagnoses
 * Get list of available diagnoses
 */
app.get('/api/diagnoses', (req, res) => {
    try {
        const diagnoses = getAllDiagnoses();
        res.json({
            success: true,
            data: diagnoses
        });
    } catch (error) {
        console.error('Error fetching diagnoses:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch diagnoses'
        });
    }
});

/**
 * POST /api/generate-care-plan
 * Main endpoint for generating care plans
 * 
 * Request body:
 * {
 *   "patientId": "P001",
 *   "diagnosisCode": "E11"
 * }
 */
app.post('/api/generate-care-plan', (req, res) => {
    try {
        const { patientId, diagnosisCode } = req.body;

        // Validate required fields
        if (!patientId || !diagnosisCode) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: patientId and diagnosisCode are required'
            });
        }

        // Fetch patient data
        const patient = getPatientById(patientId);
        if (!patient) {
            return res.status(404).json({
                success: false,
                error: `Patient not found: ${patientId}`
            });
        }

        // Generate care plan using rule engine
        console.log('\n🏥 Generating Care Plan...');
        console.log(`   Patient: ${patient.name} (${patientId})`);
        console.log(`   Diagnosis Code: ${diagnosisCode}`);

        const result = ruleEngine.generateCarePlan(patient, diagnosisCode);

        if (!result.success) {
            return res.status(400).json({
                success: false,
                error: result.error
            });
        }

        // Log decision summary for audit
        console.log('\n📋 Care Plan Generated Successfully');
        console.log(`   Treatments Recommended: ${result.carePlan.treatments.length}`);
        console.log(`   Treatments Excluded: ${result.carePlan.excludedTreatments.length}`);
        console.log(`   Dietary Recommendations: ${result.carePlan.dietPlan.length}`);
        console.log(`   Rules Applied: ${result.reasoning.totalRules}`);

        res.json({
            success: true,
            data: result.carePlan,
            reasoning: result.reasoning,
            metadata: {
                generatedAt: result.carePlan.generatedAt,
                requestId: req.auditEntry?.requestId
            }
        });

    } catch (error) {
        console.error('Error generating care plan:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate care plan',
            details: error.message
        });
    }
});

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found'
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal server error'
    });
});

// ============================================
// SERVER STARTUP
// ============================================

app.listen(PORT, () => {
    console.log('\n🏥 ========================================');
    console.log('   Clinical Decision Support System');
    console.log('   ========================================');
    console.log(`   🚀 Server running on port ${PORT}`);
    console.log(`   📡 API Base URL: http://localhost:${PORT}/api`);
    console.log('   ');
    console.log('   Available Endpoints:');
    console.log('   • GET  /api/health           - Health check');
    console.log('   • GET  /api/patients         - List all patients');
    console.log('   • GET  /api/patients/:id     - Get patient details');
    console.log('   • GET  /api/diagnoses        - List diagnoses');
    console.log('   • POST /api/generate-care-plan - Generate care plan');
    console.log('   ========================================\n');
});

module.exports = app;
