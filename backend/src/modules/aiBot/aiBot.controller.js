const aiBotService = require('./aiBot.service');
const { logAudit } = require('../../utils/auditLogger');

/**
 * AI Bot Controller
 * 
 * Handles incoming API requests for AI-generated care and diet plans.
 */

/**
 * Generate AI Insights from a Diagnosis File
 * 
 * Expects a multipart/form-data request with a file field named `diagnosisFile`.
 * Extacts the text from the file and passes it to the AI service.
 * 
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
exports.generateInsights = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No diagnosis file uploaded.' });
        }

        // GDPR Compliance: Explicit Consent Check
        if (req.body.consentGiven !== 'true' && req.body.consentGiven !== true) {
            return res.status(403).json({ success: false, error: 'Explicit consent is required to process health data.' });
        }

        const fileContent = req.file.buffer.toString('utf-8');
        console.log(`Received diagnosis file for AI analysis (${fileContent.length} bytes)`);

        // HIPAA Compliance: Log the AI processing event for audit trails
        try {
            await logAudit({
                actor_user_id: req.user ? req.user.id : null,
                action: 'AI_INSIGHTS_GENERATED',
                entity_type: 'SYSTEM',
                entity_id: null,
                ip_address: req.ip
            });
        } catch (auditErr) {
            console.error("Failed to log audit event:", auditErr);
        }

        // Send to service for LLM processing
        const insights = await aiBotService.generateInsights(fileContent);

        return res.status(200).json({
            success: true,
            data: insights
        });

    } catch (err) {
        console.error("AI Bot Controller Error:", err);
        return res.status(500).json({
            success: false,
            error: err.message || 'An error occurred while generating AI insights.'
        });
    }
};
