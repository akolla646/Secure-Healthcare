require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function checkTime() {
    try {
        const dbNow = await pool.query("SELECT NOW() as db_time, CURRENT_TIMESTAMP as current_timestamp, timezone('UTC', now()) as utc_now");
        const nodeNow = new Date();

        console.log("---------------------------------------------------");
        console.log("DB Time (NOW):", dbNow.rows[0].db_time);
        console.log("DB Time (UTC):", dbNow.rows[0].utc_now);
        console.log("Node Time (Local):", nodeNow);
        console.log("Node Time (ISO/UTC):", nodeNow.toISOString());
        console.log("---------------------------------------------------");

        // Also check the pending registration expiry
        const pending = await pool.query("SELECT expires_at, created_at FROM pending_registrations WHERE email = 'kollaakshara646@gmail.com'");
        if (pending.rowCount > 0) {
            console.log("Pending Expiry (DB):", pending.rows[0].expires_at);
            console.log("Created At (DB):", pending.rows[0].created_at);

            const expiry = new Date(pending.rows[0].expires_at);
            const isExpired = nodeNow > expiry;
            console.log("Node > Expiry?", isExpired);
            console.log("Difference (min):", (expiry - nodeNow) / 60000);
        }
    } catch (err) {
        console.error("Error:", err);
    } finally {
        process.exit();
    }
}

checkTime();
