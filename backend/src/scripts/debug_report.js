const { Pool } = require("pg");
const path = require('path');
require("dotenv").config({ path: path.join(__dirname, '../../.env') });

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});

async function checkReportDiagnostic(reportId) {
    const client = await pool.connect();
    try {
        console.log(`\n🔍 DIAGNOSTIC CHECK FOR REPORT ID: ${reportId}\n`);

        // 1. Check if Report Exists
        const reportRes = await client.query('SELECT * FROM lab_reports WHERE report_id = $1', [reportId]);
        if (reportRes.rowCount === 0) {
            console.log("❌ Report NOT FOUND in lab_reports table.");
            return;
        }
        const report = reportRes.rows[0];
        console.log(`✅ Report Found. Verified Status: ${report.verified}`);
        if (report.verified) {
            console.log("⚠️ Report is ALREADY VERIFIED. This explains why the API returns 'not found or already verified'.");
        }

        // 2. Check Lab Order
        const orderRes = await client.query('SELECT * FROM lab_orders WHERE order_id = $1', [report.order_id]);
        if (orderRes.rowCount === 0) {
            console.log("❌ Lab Order NOT FOUND for this report.");
            return;
        }
        const order = orderRes.rows[0];
        console.log(`✅ Lab Order Found. Lab Tech ID: ${order.lab_tech_id}`);

        // 3. Check Lab Tech Public Key
        if (!order.lab_tech_id) {
            console.log("❌ Lab Tech ID is NULL in lab_orders. This is a data integrity issue.");
            return;
        }

        const keyRes = await client.query('SELECT * FROM user_public_keys WHERE user_id = $1', [order.lab_tech_id]);
        if (keyRes.rowCount === 0) {
            console.log("❌ CRITICAL: Lab Tech (User ID: " + order.lab_tech_id + ") DOES NOT have a Public Key in 'user_public_keys' table.");
            console.log("   The verification query relies on an INNER JOIN with this table.");
            console.log("   👉 Fix: Generate keys for this Lab Tech user.");
        } else {
            console.log("✅ Lab Tech Public Key Found.");
        }

    } catch (err) {
        console.error("Error running diagnostic:", err);
    } finally {
        client.release();
        pool.end();
    }
}

// Get report ID from command line arg or find latest
const reportIdArg = process.argv[2];

const main = async () => {
    let targetId = reportIdArg;
    if (!targetId) {
        const client = await pool.connect();
        try {
            const res = await client.query("SELECT report_id FROM lab_reports ORDER BY created_at DESC LIMIT 1");
            if (res.rows.length > 0) {
                targetId = res.rows[0].report_id;
                console.log(`No ID provided. Using latest report ID: ${targetId}`);
            } else {
                console.log("No reports found in database.");
                return;
            }
        } finally {
            client.release();
        }
    }
    await checkReportDiagnostic(targetId);
};

main();
