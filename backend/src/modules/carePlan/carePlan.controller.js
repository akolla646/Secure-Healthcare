/**
 * Care Plan Controller
 * Generates care and diet plans from diagnosis text (no medications)
 */

const { getDiagnosisByCode, getAllDiagnoses, clinicalKnowledgeGraph } = require('../cdss/clinicalKnowledgeGraph');

/**
 * Parse diagnosis text and find matching diagnosis code
 * @param {string} diagnosisText - Free text diagnosis from file
 * @returns {Object|null} - Matched diagnosis or null
 */
function parseDiagnosis(diagnosisText) {
    const text = diagnosisText.toLowerCase().trim();

    // Direct code lookup (e.g., "E11", "I10")
    const diagnoses = clinicalKnowledgeGraph.diagnoses;
    for (const [code, diagnosis] of Object.entries(diagnoses)) {
        if (text.includes(code.toLowerCase()) ||
            text.includes(diagnosis.name.toLowerCase())) {
            return diagnosis;
        }
    }

    // Keyword matching
    const keywordMap = {
        'diabetes': 'E11',
        'type 2 diabetes': 'E11',
        'hypertension': 'I10',
        'high blood pressure': 'I10',
        'heart failure': 'I50',
        'cardiac failure': 'I50',
        'asthma': 'J45',
        'hypothyroidism': 'E03',
        'thyroid': 'E03'
    };

    for (const [keyword, code] of Object.entries(keywordMap)) {
        if (text.includes(keyword)) {
            return diagnoses[code];
        }
    }

    return null;
}

/**
 * Generate care plan without medications
 * POST /care-plan/generate
 */
const generateCarePlan = async (req, res) => {
    try {
        const { diagnosisText } = req.body;

        if (!diagnosisText || diagnosisText.trim().length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Diagnosis text is required'
            });
        }

        // Parse diagnosis from text
        const diagnosis = parseDiagnosis(diagnosisText);

        if (!diagnosis) {
            return res.status(404).json({
                success: false,
                error: 'Could not identify diagnosis from the provided text. Please ensure the diagnosis file contains a valid diagnosis name or code.',
                supportedDiagnoses: getAllDiagnoses()
            });
        }

        // Build care plan (diet and lifestyle only - NO medications)
        const carePlan = {
            patientName: req.user?.name || 'Patient',
            diagnosis: {
                code: diagnosis.code,
                name: diagnosis.name,
                category: diagnosis.category
            },
            generatedAt: new Date().toISOString(),

            // NO treatments/medications - user explicitly requested this
            treatments: [],
            excludedTreatments: [],

            // Diet recommendations
            dietPlan: (diagnosis.dietaryRecommendations || []).map((diet, index) => ({
                id: diet.id || `D-${index}`,
                name: diet.name,
                description: diet.description,
                priority: diet.priority
            })),

            // Monitoring/lifestyle as care recommendations
            monitoring: diagnosis.monitoringRequired || [],

            // General warnings (non-medication related)
            warnings: [],

            // Rules applied for explainability
            rulesApplied: [`KG-${diagnosis.category}`, `Diet-${diagnosis.code}`]
        };

        // Build reasoning for explainability
        const reasoning = {
            totalRules: carePlan.rulesApplied.length + carePlan.dietPlan.length,
            paths: [
                {
                    ruleId: `DIAG-${diagnosis.code}`,
                    reason: `Matched diagnosis: ${diagnosis.name}`,
                    category: 'inclusion',
                    timestamp: new Date().toISOString()
                },
                ...carePlan.dietPlan.map((diet, i) => ({
                    ruleId: diet.id,
                    reason: `Dietary recommendation: ${diet.name} - ${diet.description}`,
                    category: 'dietary',
                    timestamp: new Date().toISOString()
                })),
                ...carePlan.monitoring.map((item, i) => ({
                    ruleId: `MON-${i}`,
                    reason: `Monitoring required: ${item}`,
                    category: 'monitoring',
                    timestamp: new Date().toISOString()
                }))
            ]
        };

        res.json({
            success: true,
            carePlan,
            reasoning
        });

    } catch (error) {
        console.error('Care plan generation error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate care plan'
        });
    }
};

/**
 * Get list of supported diagnoses
 * GET /care-plan/diagnoses
 */
const getSupportedDiagnoses = async (req, res) => {
    try {
        const diagnoses = getAllDiagnoses();
        res.json({
            success: true,
            diagnoses
        });
    } catch (error) {
        console.error('Error fetching diagnoses:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch supported diagnoses'
        });
    }
};

module.exports = {
    generateCarePlan,
    getSupportedDiagnoses
};
