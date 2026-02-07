require('dotenv').config();
const pool = require('./src/config/db');
const { verifySignature } = require('./src/utils/digitalSignature');

async function fixSignatures() {
    const client = await pool.connect();
    try {
        console.log("Connected to DB. Fetching verified reports to check...");

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

        let fixedCount = 0;

        for (const report of rows) {
            // Check Doctor Signature
            if (!report.doctor_public_key) {
                console.error(`❌ Doctor public key MISSING for report ${report.report_id}. Unverifying...`);
                await unverifyReport(client, report.report_id);
                fixedCount++;
                continue;
            }

            const doctorValid = verifySignature(
                report.report_hash,
                report.doctor_signature.toString(),
                report.doctor_public_key
            );

            if (!doctorValid) {
                console.error(`❌ Doctor signature INVALID for report ${report.report_id}. Unverifying...`);
                await unverifyReport(client, report.report_id);
                fixedCount++;
            } else {
                console.log(`✅ Report ${report.report_id} is valid.`);
            }
        }

        console.log(`\nDone. Fixed ${fixedCount} reports.`);

    } catch (err) {
        console.error("Error:", err);
    } finally {
        client.release();
        pool.end();
    }
}

async function unverifyReport(client, reportId) {
    await client.query(`
    UPDATE lab_reports
    SET verified = false,
        doctor_signature = NULL,
        verified_at = NULL,
        verified_by = NULL
    WHERE report_id = $1
  `, [reportId]);
    console.log(`   -> Report ${reportId} marked as UNVERIFIED.`);
}

fixSignatures();
