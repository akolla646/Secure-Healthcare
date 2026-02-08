const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function migrate() {
    try {
        // Try setting default to gen_random_uuid()
        await pool.query("ALTER TABLE doctors ALTER COLUMN doctor_id SET DEFAULT gen_random_uuid()");
        console.log("Successfully set default for doctor_id");
    } catch (err) {
        console.error("Migration failed:", err);
        // Fallback or just log error
        if (err.message.includes("gen_random_uuid")) {
            console.log("gen_random_uuid() not found, trying uuid_generate_v4()");
            try {
                await pool.query("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\"");
                await pool.query("ALTER TABLE doctors ALTER COLUMN doctor_id SET DEFAULT uuid_generate_v4()");
                console.log("Successfully set default for doctor_id using uuid-ossp");
            } catch (e2) {
                console.error("Fallback failed:", e2);
            }
        }
    } finally {
        pool.end();
    }
}

migrate();
