const path = require("path");
const fs = require("fs");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });
const pool = require("./src/config/db");

async function checkCounts() {
    const logFile = path.resolve(__dirname, "counts_debug.txt");
    const logStream = fs.createWriteStream(logFile);

    try {
        const tables = ['users', 'user_roles', 'roles', 'user_public_keys'];
        for (const table of tables) {
            const res = await pool.query(`SELECT COUNT(*) FROM ${table}`);
            logStream.write(`${table}: ${res.rows[0].count}\n`);
        }
    } catch (err) {
        logStream.write(`ERROR: ${err.message}\n`);
    } finally {
        logStream.end();
        await pool.end();
    }
}

checkCounts();
