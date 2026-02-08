const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' }); // Adjusted path for running from migrations folder

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function migrate() {
    try {
        await pool.query("ALTER TABLE doctors ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20)");
        console.log("Successfully added phone_number to doctors table");
    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        pool.end();
    }
}

migrate();
