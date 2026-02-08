const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function migrate() {
    try {
        await pool.query("ALTER TABLE doctors DROP CONSTRAINT IF EXISTS doctors_doctor_id_fkey");
        console.log("Successfully dropped constraint doctors_doctor_id_fkey");
    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        pool.end();
    }
}

migrate();
