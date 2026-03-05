const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function fixTimezone() {
    try {
        console.log("Connecting...");
        const client = await pool.connect();

        console.log("Altering vitals table created_at to TIMESTAMPTZ...");
        await client.query(`
            ALTER TABLE vitals 
            ALTER COLUMN created_at TYPE TIMESTAMPTZ 
            USING created_at AT TIME ZONE 'UTC';
        `);

        console.log("Successfully altered vitals table.");
        client.release();
    } catch (err) {
        console.error("Failed:", err.message);
    } finally {
        pool.end();
    }
}

fixTimezone();
