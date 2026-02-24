const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function checkAvailability() {
    try {
        console.log("Fetching doctors and their availability...");
        const client = await pool.connect();

        const doctorsObj = await client.query('SELECT doctor_id, full_name FROM doctors');
        console.log("Doctors:");
        console.table(doctorsObj.rows);

        const availObj = await client.query('SELECT * FROM doctor_availability');
        console.log("Availability Slots:");
        console.table(availObj.rows);

        client.release();
    } catch (err) {
        console.error("Failed:", err.message);
    } finally {
        pool.end();
    }
}

checkAvailability();
