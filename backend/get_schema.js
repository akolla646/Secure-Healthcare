const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });
const pool = require("./src/config/db");

async function getSchema() {
    try {
        const res = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'users'");
        console.log("Users Table Columns:");
        console.log(res.rows.map(r => r.column_name).join(", "));

        const rolesRes = await pool.query("SELECT DISTINCT role FROM users");
        console.log("\nExisting Roles:");
        console.log(rolesRes.rows.map(r => r.role).join(", "));
    } catch (err) {
        console.error("Failed to get schema:", err);
    } finally {
        await pool.end();
    }
}

getSchema();
