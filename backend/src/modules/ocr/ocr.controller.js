const ocrService = require('./ocr.service');
const { getDiagnosisByCode } = require('../cdss/clinicalKnowledgeGraph');
const RuleEngine = require('../cdss/ruleEngine');
const pool = require('../../config/db');

const ruleEngine = new RuleEngine();

exports.uploadPrescription = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No image file uploaded. Please upload a prescription image.',
            });
        }

        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/bmp', 'image/tiff'];
        if (!allowedTypes.includes(req.file.mimetype)) {
            return res.status(400).json({
                success: false,
                error: `Unsupported file type: ${req.file.mimetype}. Please upload JPEG, PNG, WebP, BMP, or TIFF.`,
            });
        }

        console.log(`📸 Prescription image received: ${req.file.originalname} (${(req.file.size / 1024).toFixed(1)} KB)`);

        const result = await ocrService.processPrescriptionImage(
            req.file.buffer,
            req.file.mimetype
        );

        let savedId = null;
        if (result.cleaned.quality !== 'poor') {
            try {
                const insertResult = await pool.query(
                    `INSERT INTO prescription_ocr 
                     (raw_text, cleaned_text, ocr_confidence, quality, medications, diagnosis_codes, patient_info, original_filename)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                     RETURNING id`,
                    [
                        result.ocr.rawText,
                        result.cleaned.text,
                        result.ocr.confidence,
                        result.cleaned.quality,
                        JSON.stringify(result.extracted.medications),
                        JSON.stringify(result.extracted.diagnosisCodes),
                        JSON.stringify(result.extracted.patientInfo),
                        req.file.originalname,
                    ]
                );
                savedId = insertResult.rows[0].id;
                console.log(`💾 OCR result saved with ID: ${savedId}`);
            } catch (dbErr) {
                console.warn('⚠️ Could not save OCR result to database:', dbErr.message);
            }
        }

        return res.json({
            success: true,
            data: {
                id: savedId,
                ocr: {
                    confidence: result.ocr.confidence,
                    wordCount: result.ocr.wordCount,
                    lineCount: result.ocr.lineCount,
                },
                rawText: result.ocr.rawText,
                cleanedText: result.cleaned.text,
                quality: result.cleaned.quality,
                corrections: result.cleaned.corrections,
                stats: result.cleaned.stats,
                medications: result.extracted.medications,
                diagnosisCodes: result.extracted.diagnosisCodes,
                patientInfo: result.extracted.patientInfo,
            },
        });

    } catch (err) {
        console.error('❌ Prescription OCR Error:', err);
        return res.status(500).json({
            success: false,
            error: 'Failed to process prescription image. Please try again with a clearer image.',
        });
    }
};

exports.generatePlanFromPrescription = async (req, res) => {
    try {
        const { diagnosisCode, patientId, patientName, medications } = req.body;

        if (!diagnosisCode) {
            return res.status(400).json({
                success: false,
                error: 'Diagnosis code is required. Please extract it from the prescription first.',
            });
        }

        const diagnosisData = getDiagnosisByCode(diagnosisCode);
        if (!diagnosisData) {
            return res.status(400).json({
                success: false,
                error: `Diagnosis code "${diagnosisCode}" is not supported. Supported codes: E11, I10, I50, J45, E03.`,
            });
        }

        const patientContext = {
            id: patientId || 'OCR_PATIENT',
            name: patientName || 'Patient',
            allergies: [],
            chronicConditions: [],
            recentLabValues: {},
            currentMedications: medications || [],
        };

        if (patientId) {
            try {
                const patientRes = await pool.query(
                    'SELECT full_name_encrypted FROM patients WHERE patient_id = $1 OR user_id::text = $1',
                    [patientId]
                );
                if (patientRes.rows.length > 0) {
                    patientContext.name = patientRes.rows[0].full_name_encrypted || patientName;
                }
            } catch (e) {
                console.warn('Could not fetch patient data:', e.message);
            }
        }

        const result = ruleEngine.generateCarePlan(patientContext, diagnosisCode);

        if (result.success) {
            result.carePlan.prescriptionSource = 'OCR';
            result.carePlan.extractedMedications = medications || [];

            return res.json({
                success: true,
                data: result.carePlan,
                reasoning: result.reasoning,
            });
        } else {
            return res.status(400).json({
                success: false,
                error: result.error,
            });
        }

    } catch (err) {
        console.error('❌ Generate Plan from Prescription Error:', err);
        return res.status(500).json({
            success: false,
            error: 'Failed to generate care plan from prescription data.',
        });
    }
};

exports.getHistory = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, ocr_confidence, quality, medications, diagnosis_codes, patient_info, original_filename, created_at
             FROM prescription_ocr
             ORDER BY created_at DESC
             LIMIT 20`
        );

        return res.json({
            success: true,
            data: result.rows.map(row => ({
                id: row.id,
                confidence: row.ocr_confidence,
                quality: row.quality,
                medications: row.medications,
                diagnosisCodes: row.diagnosis_codes,
                patientInfo: row.patient_info,
                filename: row.original_filename,
                createdAt: row.created_at,
            })),
        });
    } catch (err) {
        console.error('❌ Fetch OCR History Error:', err);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch OCR history.',
        });
    }
};

exports.getById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            'SELECT * FROM prescription_ocr WHERE id = $1',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'OCR result not found.' });
        }

        const row = result.rows[0];
        return res.json({
            success: true,
            data: {
                id: row.id,
                rawText: row.raw_text,
                cleanedText: row.cleaned_text,
                confidence: row.ocr_confidence,
                quality: row.quality,
                medications: row.medications,
                diagnosisCodes: row.diagnosis_codes,
                patientInfo: row.patient_info,
                filename: row.original_filename,
                createdAt: row.created_at,
            },
        });
    } catch (err) {
        console.error('❌ Fetch OCR by ID Error:', err);
        return res.status(500).json({ success: false, error: 'Failed to fetch OCR result.' });
    }
};
