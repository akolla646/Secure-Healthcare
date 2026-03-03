require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        await pool.query("ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointment_status_check");
        await pool.query("ALTER TABLE appointments ADD CONSTRAINT appointment_status_check CHECK (status IN ('SCHEDULED', 'COMPLETED', 'CANCELLED', 'PAID'))");
        console.log('Successfully updated constraint!');

        // Retry updates
        await pool.query("UPDATE appointments SET status='PAID' WHERE appointment_id='c807f0d2-0067-45ae-b6d1-d5a71c5f0f73'");
        console.log('Fixed March 25th!');
        await pool.query("UPDATE appointments SET status='PAID' WHERE appointment_id='ff17dc11-a2a7-4298-b21a-53332fb6fef7'");
        console.log('Fixed April 1st!');

    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}
run();
