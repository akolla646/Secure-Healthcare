require('dotenv').config();
const pool = require('./src/config/db');
const { verifySignature } = require('./src/utils/digitalSignature');

async function debugSignatures() {
    const client = await pool.connect();
    try {
        console.log("Connected to DB. Fetching verified reports...");

        const { rows } = await client.query(`
      SELECT 
        lr.report_id,
        lr.report_hash,
        lr.doctor_signature,
        lr.lab_tech_signature,
        lr.verified,
        lo.doctor_id,
        lo.lab_tech_id,
        doc_key.public_key_pem AS doctor_public_key,
        lab_key.public_key_pem AS lab_public_key
      FROM lab_reports lr
      JOIN lab_orders lo ON lr.order_id = lo.order_id
      LEFT JOIN user_public_keys doc_key ON doc_key.user_id = lr.verified_by
      LEFT JOIN user_public_keys lab_key ON lab_key.user_id = lo.lab_tech_id
      WHERE lr.verified = true
    `);

        console.log(`Found ${rows.length} verified reports.`);

        let passed = 0;
        let failed = 0;

        for (const report of rows) {
            console.log(`\nChecking Report ID: ${report.report_id}`);

            // Check Doctor Signature
            if (!report.doctor_public_key) {
                console.error(`❌ Doctor public key MISSING for doctor_id: ${report.doctor_id}`);
                failed++;
                continue;
            }

            const doctorValid = verifySignature(
                report.report_hash,
                report.doctor_signature.toString(),
                report.doctor_public_key
            );

            if (doctorValid) {
                console.log("✅ Doctor signature VALID");
                passed++;
            } else {
                console.error("❌ Doctor signature INVALID");
                failed++;
            }

            // Check Lab Tech Signature (optional context)
            if (report.lab_public_key) {
                const labValid = verifySignature(
                    report.report_hash,
                    report.lab_tech_signature.toString(),
                    report.lab_public_key
                );
                if (labValid) {
                    console.log("✅ Lab signature VALID");
                } else {
                    console.log("❌ Lab signature INVALID");
                }
            } else {
                console.log("⚠️ Lab public key MISSING");
            }

        }

        console.log(`\nSummary: ${passed} passed, ${failed} failed.`);

    } catch (err) {
        console.error("Error:", err);
    } finally {
        client.release();
        pool.end();
    }
}

debugSignatures();
