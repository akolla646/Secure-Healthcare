const path = require("path");
const fs = require("fs");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });
const pool = require("./src/config/db");

async function dump() {
    const logFile = path.resolve(__dirname, "dump.txt");
    if (fs.existsSync(logFile)) fs.unlinkSync(logFile);

    try {
        const res = await pool.query(`
      SELECT u.user_id, u.email, r.role_name, 
             (SELECT COUNT(*) FROM user_public_keys upk WHERE upk.user_id = u.user_id) as key_count
      FROM users u
      LEFT JOIN user_roles ur ON u.user_id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.role_id
    `);

        fs.appendFileSync(logFile, `Total Users: ${res.rowCount}\n`);
        res.rows.forEach(u => {
            fs.appendFileSync(logFile, `${u.user_id} | ${u.email} | ${u.role_name} | Keys: ${u.key_count}\n`);
        });
        console.log("Dump finished.");
    } catch (err) {
        fs.appendFileSync(logFile, `ERROR: ${err.message}\n`);
        console.error(err);
    } finally {
        await pool.end();
    }
}

dump();
