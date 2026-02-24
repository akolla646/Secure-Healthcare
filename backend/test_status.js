require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function checkStatus() {
    try {
        const { rows } = await pool.query('SELECT appointment_id, doctor_id, scheduled_start, status FROM appointments ORDER BY created_at DESC LIMIT 5');
        console.table(rows);
    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}
checkStatus();
