const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });
const pool = require("./src/config/db");

async function listUsers() {
    try {
        const res = await pool.query("SELECT * FROM users");
        console.log("Registered Users count:", res.rowCount);
        res.rows.forEach(u => {
            console.log(JSON.stringify(u));
        });
    } catch (err) {
        console.error("Failed to list users:", err);
    } finally {
        await pool.end();
    }
}

listUsers();
