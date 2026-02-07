require("dotenv").config();
const pool = require('./src/config/db');

async function check() {
    try {
        console.log("Check Users:");
        const users = await pool.query("SELECT user_id, username, email FROM users WHERE username = 'Akshara' OR email = 'kollaakshara646@gmail.com'");
        console.log("Users Found:", users.rows);

        console.log("Check Pending:");
        const pending = await pool.query("SELECT pending_id, email, full_name, otp_hash FROM pending_registrations WHERE email = 'kollaakshara646@gmail.com'");
        console.log("Pending Found:", pending.rows);

    } catch (err) {
        console.error("Verification Error:", err);
    } finally {
        // Force exit as pool keeps connection open
        process.exit(0);
    }
}

check();
