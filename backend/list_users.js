const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });
const pool = require("./src/config/db");

async function listUsers() {
    try {
        const res = await pool.query("SELECT user_id, email, role FROM users");
        console.log("Registered Users:");
        res.rows.forEach(u => {
            console.log(`- ID: ${u.user_id} | Email: ${u.email} | Role: ${u.role}`);
        });
    } catch (err) {
        console.error("Failed to list users:", err);
    } finally {
        await pool.end();
    }
}

listUsers();
