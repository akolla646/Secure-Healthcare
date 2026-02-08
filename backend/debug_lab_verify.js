const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });
const pool = require("./src/config/db");

async function debugLabReport(reportId) {
    try {
        console.log(`\n--- Debugging report: ${reportId} ---`);

        // Check lab_reports
        const reportRes = await pool.query("SELECT * FROM lab_reports WHERE report_id = $1", [reportId]);
        console.log("Lab Report found:", reportRes.rowCount > 0);
        if (reportRes.rowCount > 0) {
            const report = reportRes.rows[0];
            console.log("Order ID:", report.order_id);
            console.log("Report Hash:", report.report_hash);

            // Check lab_orders
            const orderRes = await pool.query("SELECT * FROM lab_orders WHERE order_id = $1", [report.order_id]);
            console.log("Lab Order found:", orderRes.rowCount > 0);
            if (orderRes.rowCount > 0) {
                const order = orderRes.rows[0];
                console.log("Lab Tech ID:", order.lab_tech_id);

                // Check user_public_keys
                if (!order.lab_tech_id) {
                    console.log("WARNING: lab_tech_id is NULL for this order.");
                } else {
                    const keyRes = await pool.query("SELECT * FROM user_public_keys WHERE user_id = $1", [order.lab_tech_id]);
                    console.log("Lab Tech Public Key found:", keyRes.rowCount > 0);
                    if (keyRes.rowCount > 0) {
                        console.log("Public Key PEM starts with:", keyRes.rows[0].public_key_pem.substring(0, 30));
                    } else {
                        console.log("CRITICAL: Lab Tech PUBLIC KEY MISSING in user_public_keys table.");
                    }
                }
            }
        }
    } catch (err) {
        console.error("Error debugging lab report:", err);
    }
}

async function listPending() {
    try {
        const res = await pool.query("SELECT report_id, order_id FROM lab_reports WHERE verified = false");
        console.log(`Total Pending Reports: ${res.rowCount}`);
        for (const row of res.rows) {
            await debugLabReport(row.report_id);
        }
    } catch (err) {
        console.error("Query failed:", err.message);
    } finally {
        await pool.end();
    }
}

listPending();
