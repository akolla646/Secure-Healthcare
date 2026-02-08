const path = require("path");
const fs = require("fs");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });
const pool = require("./src/config/db");

async function checkKeys() {
    const logFile = path.resolve(__dirname, "keys_debug.txt");
    if (fs.existsSync(logFile)) fs.unlinkSync(logFile);

    try {
        const res = await pool.query(`SELECT user_id, public_key_pem FROM user_public_keys`);
        res.rows.forEach(r => {
            fs.appendFileSync(logFile, `User: ${r.user_id}\nKey: ${r.public_key_pem.substring(0, 50)}...\n\n`);
        });
    } catch (err) {
        fs.appendFileSync(logFile, `ERROR: ${err.message}\n`);
    } finally {
        await pool.end();
    }
}

checkKeys();
