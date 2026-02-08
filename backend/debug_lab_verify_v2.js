const path = require("path");
const fs = require("fs");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });
const pool = require("./src/config/db");

const logFile = path.resolve(__dirname, "debug_log.txt");
const logStream = fs.createWriteStream(logFile);

function log(msg) {
    console.log(msg);
    logStream.write(msg + "\n");
}

async function debugLabReport(reportId) {
    try {
        log(`\n--- Debugging report: ${reportId} ---`);

        // Check lab_reports
        const reportRes = await pool.query("SELECT * FROM lab_reports WHERE report_id = $1", [reportId]);
        log(`Lab Report found: ${reportRes.rowCount > 0}`);
        if (reportRes.rowCount > 0) {
            const report = reportRes.rows[0];
            log(`Order ID: ${report.order_id}`);

            // Check lab_orders
            const orderRes = await pool.query("SELECT * FROM lab_orders WHERE order_id = $1", [report.order_id]);
            log(`Lab Order found: ${orderRes.rowCount > 0}`);
            if (orderRes.rowCount > 0) {
                const order = orderRes.rows[0];
                log(`Lab Tech ID: ${order.lab_tech_id}`);

                // Check user_public_keys
                if (!order.lab_tech_id) {
                    log("WARNING: lab_tech_id is NULL for this order.");
                } else {
                    const keyRes = await pool.query("SELECT * FROM user_public_keys WHERE user_id = $1", [order.lab_tech_id]);
                    log(`Lab Tech Public Key found: ${keyRes.rowCount > 0}`);
                    if (keyRes.rowCount > 0) {
                        log(`Public Key PEM starts with: ${keyRes.rows[0].public_key_pem.substring(0, 30)}`);
                    } else {
                        log(`CRITICAL: Lab Tech PUBLIC KEY MISSING in user_public_keys table for user_id ${order.lab_tech_id}.`);
                    }
                }
            }
        }
    } catch (err) {
        log(`Error debugging lab report: ${err.message}`);
    }
}

async function listPending() {
    try {
        const res = await pool.query("SELECT report_id, order_id FROM lab_reports WHERE verified = false");
        log(`Total Pending Reports: ${res.rowCount}`);
        for (const row of res.rows) {
            await debugLabReport(row.report_id);
        }
    } catch (err) {
        log(`Query failed: ${err.message}`);
    } finally {
        logStream.end();
        await pool.end();
    }
}

listPending();
