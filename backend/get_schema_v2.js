const path = require("path");
const fs = require("fs");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });
const pool = require("./src/config/db");

async function getSchema() {
    const logFile = path.resolve(__dirname, "schema_debug.txt");
    const logStream = fs.createWriteStream(logFile);

    try {
        const res = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users'");
        res.rows.forEach(r => {
            logStream.write(`${r.column_name} (${r.data_type})\n`);
        });

        // Also check if there's a roles table or something
        const tablesRes = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        logStream.write("\nTables:\n");
        tablesRes.rows.forEach(t => {
            logStream.write(`${t.table_name}\n`);
        });

    } catch (err) {
        logStream.write(`ERROR: ${err.message}\n`);
    } finally {
        logStream.end();
        await pool.end();
    }
}

getSchema();
