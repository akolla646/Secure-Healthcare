const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function checkAppointments() {
    try {
        const { rows } = await pool.query("SELECT appointment_id, patient_id, doctor_id, scheduled_start, scheduled_end, status FROM appointments WHERE scheduled_start >= '2026-04-01T00:00:00Z' ORDER BY scheduled_start ASC");
        console.log("Matches:", rows.length);
        console.table(rows);
    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}
checkAppointments();
