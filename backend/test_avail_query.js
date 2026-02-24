const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function runTest() {
    const query = `
    SELECT * FROM doctor_availability
    WHERE doctor_id = '5fc9f9ba-8c78-4746-acc3-70e3c05b4f97'
      AND day_of_week = 5
      AND '10:00:00' >= start_time
      AND '10:30:00' <= end_time
      AND is_active = TRUE
  `;
    try {
        const { rows } = await pool.query(query);
        console.log("Matched rows:", rows.length);
        console.table(rows);
    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}
runTest();
