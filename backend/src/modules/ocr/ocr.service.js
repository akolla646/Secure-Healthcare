const Tesseract = require('tesseract.js');
const path = require('path');

const KNOWN_MEDICATIONS = [
    'metformin', 'glipizide', 'glyburide', 'insulin', 'sitagliptin',
    'empagliflozin', 'dapagliflozin', 'canagliflozin', 'pioglitazone',
    'liraglutide', 'semaglutide', 'dulaglutide',
    'lisinopril', 'amlodipine', 'losartan', 'valsartan', 'metoprolol',
    'atenolol', 'hydrochlorothiazide', 'furosemide', 'spironolactone',
    'ramipril', 'enalapril', 'nifedipine', 'diltiazem',
    'aspirin', 'clopidogrel', 'warfarin', 'rivaroxaban', 'apixaban',
    'atorvastatin', 'rosuvastatin', 'simvastatin', 'digoxin',
    'salbutamol', 'albuterol', 'fluticasone', 'montelukast',
    'ipratropium', 'budesonide', 'prednisone', 'prednisolone',
    'amoxicillin', 'azithromycin', 'ciprofloxacin', 'doxycycline',
    'ibuprofen', 'acetaminophen', 'paracetamol', 'omeprazole',
    'pantoprazole', 'ranitidine', 'cetirizine', 'loratadine',
    'gabapentin', 'pregabalin', 'levothyroxine',
];

const DOSAGE_PATTERNS = [
    /(\d+\.?\d*)\s*(mg|mcg|ml|g|iu|units?)/gi,
    /(\d+)\s*[-\/]\s*(\d+)\s*(mg|mcg|ml|g)/gi,
];

const FREQUENCY_PATTERNS = [
    { pattern: /once\s*(a\s*)?daily|od|q\.?d\.?|qd/gi, normalized: 'Once daily' },
    { pattern: /twice\s*(a\s*)?daily|bid|b\.?i\.?d\.?/gi, normalized: 'Twice daily' },
    { pattern: /three\s*times\s*(a\s*)?daily|tid|t\.?i\.?d\.?/gi, normalized: 'Three times daily' },
    { pattern: /four\s*times\s*(a\s*)?daily|qid|q\.?i\.?d\.?/gi, normalized: 'Four times daily' },
    { pattern: /every\s*(\d+)\s*hours?|q(\d+)h/gi, normalized: 'Every $1 hours' },
    { pattern: /at\s*bedtime|hs|h\.?s\.?|nocte/gi, normalized: 'At bedtime' },
    { pattern: /before\s*meals?|ac|a\.?c\.?/gi, normalized: 'Before meals' },
    { pattern: /after\s*meals?|pc|p\.?c\.?/gi, normalized: 'After meals' },
    { pattern: /as\s*needed|prn|p\.?r\.?n\.?/gi, normalized: 'As needed' },
    { pattern: /with\s*food/gi, normalized: 'With food' },
    { pattern: /morning/gi, normalized: 'Morning' },
    { pattern: /evening|night/gi, normalized: 'Evening' },
];

const DIAGNOSIS_CODE_PATTERNS = [
    /\b(E1[0-4])\b/gi,
    /\b(I1[0-5])\b/gi,
    /\b(I50)\b/gi,
    /\b(J4[0-7])\b/gi,
    /\b(E0[0-7])\b/gi,
    /\b(J45)\b/gi,
    /\b([A-Z]\d{2}(?:\.\d{1,2})?)\b/g,
];

async function extractTextFromImage(imageBuffer, mimeType) {
    try {
        console.log('🔍 Starting OCR extraction...');

        const result = await Tesseract.recognize(
            imageBuffer,
            'eng',
            {
                logger: (m) => {
                    if (m.status === 'recognizing text') {
                        console.log(`  OCR Progress: ${Math.round(m.progress * 100)}%`);
                    }
                }
            }
        );

        const rawText = result.data.text;
        const confidence = result.data.confidence;

        console.log(`✅ OCR extraction complete. Confidence: ${confidence}%`);
        console.log(`📄 Raw text length: ${rawText.length} characters`);

        return {
            rawText,
            confidence,
            words: result.data.words ? result.data.words.length : 0,
            lines: rawText.split('\n').filter(l => l.trim()).length,
        };
    } catch (error) {
        console.error('❌ OCR extraction failed:', error.message);
        throw new Error(`OCR extraction failed: ${error.message}`);
    }
}

function cleanPrescriptionText(rawText) {
    if (!rawText || typeof rawText !== 'string') {
        return { cleanedText: '', corrections: [], quality: 'poor' };
    }

    const corrections = [];
    let text = rawText;

    const ocrCorrections = [
        { from: /[|l](?=\d)/g, to: '1', desc: 'pipe/l → 1 before digit' },
        { from: /(?<=\d)[oO]/g, to: '0', desc: 'o/O → 0 after digit' },
        { from: /(?<=\d)\s+(?=mg|mcg|ml|g\b)/gi, to: '', desc: 'remove space before unit' },
        { from: /rng/gi, to: 'mg', desc: 'rng → mg' },
        { from: /rnl/gi, to: 'ml', desc: 'rnl → ml' },
        { from: /\bTab\b\.?/gi, to: 'Tablet', desc: 'Tab → Tablet' },
        { from: /\bCap\b\.?/gi, to: 'Capsule', desc: 'Cap → Capsule' },
        { from: /\bInj\b\.?/gi, to: 'Injection', desc: 'Inj → Injection' },
        { from: /\bSyr\b\.?/gi, to: 'Syrup', desc: 'Syr → Syrup' },
        { from: /\bOint\b\.?/gi, to: 'Ointment', desc: 'Oint → Ointment' },
        { from: /\bSusp\b\.?/gi, to: 'Suspension', desc: 'Susp → Suspension' },
    ];

    for (const correction of ocrCorrections) {
        const before = text;
        text = text.replace(correction.from, correction.to);
        if (before !== text) {
            corrections.push(correction.desc);
        }
    }

    text = text.replace(/[ \t]+/g, ' ');
    text = text.replace(/\n{3,}/g, '\n\n');
    text = text.replace(/^\s+|\s+$/gm, '');

    text = text.replace(/[^\w\s\.\,\;\:\-\/\(\)\#\@\%\+\=\'\"\!\?\n]/g, '');

    const lines = text.split('\n');
    const mergedLines = [];
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) {
            mergedLines.push('');
            continue;
        }
        if (line.length < 15 && i + 1 < lines.length && lines[i + 1].trim() &&
            !/^(Rx|Dr|Patient|Date|Diagnosis|Medication|Dosage|Note|#|\d+\.)/i.test(lines[i + 1])) {
            mergedLines.push(line + ' ' + lines[i + 1].trim());
            i++;
            corrections.push('merged broken line');
        } else {
            mergedLines.push(line);
        }
    }
    text = mergedLines.join('\n');

    const totalChars = text.length;
    const alphanumericCount = (text.match(/[a-zA-Z0-9]/g) || []).length;
    const ratio = totalChars > 0 ? alphanumericCount / totalChars : 0;
    let quality = 'good';
    if (ratio < 0.5 || totalChars < 20) quality = 'poor';
    else if (ratio < 0.7) quality = 'fair';

    return {
        cleanedText: text.trim(),
        corrections,
        quality,
        stats: {
            originalLength: rawText.length,
            cleanedLength: text.trim().length,
            correctionsApplied: corrections.length,
            alphanumericRatio: Math.round(ratio * 100) + '%',
        }
    };
}

function extractMedications(cleanedText) {
    const medications = [];
    const lines = cleanedText.split('\n').filter(l => l.trim());
    const textLower = cleanedText.toLowerCase();

    for (const med of KNOWN_MEDICATIONS) {
        const medRegex = new RegExp(`\\b${med}\\b`, 'gi');
        const matches = textLower.match(medRegex);

        if (matches) {
            const medLine = lines.find(l => l.toLowerCase().includes(med));
            if (medLine) {
                let dosage = null;
                for (const dp of DOSAGE_PATTERNS) {
                    const dosageMatch = medLine.match(dp);
                    if (dosageMatch) {
                        dosage = dosageMatch[0];
                        break;
                    }
                }

                let frequency = null;
                for (const fp of FREQUENCY_PATTERNS) {
                    if (fp.pattern.test(medLine)) {
                        frequency = fp.normalized;
                        fp.pattern.lastIndex = 0;
                        break;
                    }
                }

                if (!medications.find(m => m.name.toLowerCase() === med)) {
                    medications.push({
                        name: med.charAt(0).toUpperCase() + med.slice(1),
                        dosage: dosage || 'Not specified',
                        frequency: frequency || 'Not specified',
                        rawLine: medLine.trim(),
                        confidence: 'high',
                    });
                }
            }
        }
    }

    if (medications.length === 0) {
        const rxPattern = /(?:^\d+[\.)\]]\s*|^Rx\s*:?\s*|^[-•]\s*)([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)\s+(\d+\.?\d*\s*(?:mg|mcg|ml|g|iu|units?))/gim;
        let match;
        while ((match = rxPattern.exec(cleanedText)) !== null) {
            const name = match[1].trim();
            const dosage = match[2].trim();

            const lineEndIdx = cleanedText.indexOf('\n', match.index);
            const fullLine = cleanedText.substring(match.index, lineEndIdx > -1 ? lineEndIdx : undefined);

            let frequency = 'Not specified';
            for (const fp of FREQUENCY_PATTERNS) {
                if (fp.pattern.test(fullLine)) {
                    frequency = fp.normalized;
                    fp.pattern.lastIndex = 0;
                    break;
                }
            }

            if (!medications.find(m => m.name.toLowerCase() === name.toLowerCase())) {
                medications.push({
                    name,
                    dosage,
                    frequency,
                    rawLine: fullLine.trim(),
                    confidence: 'medium',
                });
            }
        }
    }

    return medications;
}

function extractDiagnosisCodes(cleanedText) {
    const codes = new Set();

    for (const pattern of DIAGNOSIS_CODE_PATTERNS) {
        let match;
        const regex = new RegExp(pattern.source, pattern.flags);
        while ((match = regex.exec(cleanedText)) !== null) {
            codes.add(match[1] || match[0]);
        }
    }

    return Array.from(codes);
}

function extractPatientInfo(cleanedText) {
    const info = {
        name: null,
        id: null,
        age: null,
        gender: null,
        date: null,
        doctor: null,
    };

    const nameMatch = cleanedText.match(/Patient\s*(?:Name)?\s*:?\s*([A-Z][a-zA-Z\s\.]+?)(?:\n|$|Age|Gender|DOB|ID)/i);
    if (nameMatch) info.name = nameMatch[1].trim();

    const idMatch = cleanedText.match(/(?:Patient\s*)?ID\s*:?\s*([A-Za-z0-9\-]+)/i);
    if (idMatch) info.id = idMatch[1].trim();

    const ageMatch = cleanedText.match(/Age\s*:?\s*(\d{1,3})\s*(?:years?|yrs?|y)?/i);
    if (ageMatch) info.age = parseInt(ageMatch[1]);

    const genderMatch = cleanedText.match(/(?:Gender|Sex)\s*:?\s*(Male|Female|M|F|Other)/i);
    if (genderMatch) {
        const g = genderMatch[1].toUpperCase();
        info.gender = g === 'M' ? 'Male' : g === 'F' ? 'Female' : genderMatch[1];
    }

    const dateMatch = cleanedText.match(/Date\s*:?\s*(\d{1,2}[\-\/\.]\d{1,2}[\-\/\.]\d{2,4})/i);
    if (dateMatch) info.date = dateMatch[1];

    const doctorMatch = cleanedText.match(/(?:Dr\.?|Doctor)\s*:?\s*([A-Z][a-zA-Z\s\.]+?)(?:\n|$|Reg|Spec)/i);
    if (doctorMatch) info.doctor = doctorMatch[1].trim();

    return info;
}

async function processPrescriptionImage(imageBuffer, mimeType) {
    const ocrResult = await extractTextFromImage(imageBuffer, mimeType);
    const cleanResult = cleanPrescriptionText(ocrResult.rawText);
    const medications = extractMedications(cleanResult.cleanedText);
    const diagnosisCodes = extractDiagnosisCodes(cleanResult.cleanedText);
    const patientInfo = extractPatientInfo(cleanResult.cleanedText);

    return {
        ocr: {
            rawText: ocrResult.rawText,
            confidence: ocrResult.confidence,
            wordCount: ocrResult.words,
            lineCount: ocrResult.lines,
        },
        cleaned: {
            text: cleanResult.cleanedText,
            quality: cleanResult.quality,
            corrections: cleanResult.corrections,
            stats: cleanResult.stats,
        },
        extracted: {
            medications,
            diagnosisCodes,
            patientInfo,
        },
    };
}

module.exports = {
    extractTextFromImage,
    cleanPrescriptionText,
    extractMedications,
    extractDiagnosisCodes,
    extractPatientInfo,
    processPrescriptionImage,
};
