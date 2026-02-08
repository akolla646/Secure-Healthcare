const path = require("path");
const fs = require("fs");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });
const pool = require("./src/config/db");

async function getSchema() {
    const logFile = path.resolve(__dirname, "roles_schema_debug.txt");
    const logStream = fs.createWriteStream(logFile);

    try {
        const res = await pool.query("SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_name IN ('user_roles', 'roles')");
        res.rows.forEach(r => {
            logStream.write(`${r.table_name}: ${r.column_name} (${r.data_type})\n`);
        });
    } catch (err) {
        logStream.write(`ERROR: ${err.message}\n`);
    } finally {
        logStream.end();
        await pool.end();
    }
}

getSchema();
