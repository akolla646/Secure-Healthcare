const path = require("path");
const fs = require("fs");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });
const pool = require("./src/config/db");

async function listUsers() {
    const logFile = path.resolve(__dirname, "users_debug.txt");
    const logStream = fs.createWriteStream(logFile);

    try {
        const res = await pool.query("SELECT user_id, email, role FROM users");
        logStream.write(`count: ${res.rowCount}\n`);
        res.rows.forEach(u => {
            logStream.write(`${u.user_id} | ${u.email} | ${u.role}\n`);
        });
        console.log("Done. Check users_debug.txt");
    } catch (err) {
        logStream.write(`ERROR: ${err.message}\n`);
        console.error(err);
    } finally {
        logStream.end();
        await pool.end();
    }
}

listUsers();
