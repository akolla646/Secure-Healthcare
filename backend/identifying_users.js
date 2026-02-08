const path = require("path");
const fs = require("fs");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });
const pool = require("./src/config/db");

async function listUsers() {
    const logFile = path.resolve(__dirname, "users_final_debug.txt");
    const logStream = fs.createWriteStream(logFile);

    try {
        const query = `
      SELECT u.user_id, u.email, r.role_name
      FROM users u
      JOIN user_roles ur ON u.user_id = ur.user_id
      JOIN roles r ON ur.role_id = r.role_id
    `;
        const res = await pool.query(query);
        logStream.write(`count: ${res.rowCount}\n`);
        res.rows.forEach(u => {
            logStream.write(`${u.user_id} | ${u.email} | ${u.role_name}\n`);
        });
        console.log("Done. Check users_final_debug.txt");
    } catch (err) {
        logStream.write(`ERROR: ${err.message}\n`);
        console.error(err);
    } finally {
        logStream.end();
        await pool.end();
    }
}

listUsers();
