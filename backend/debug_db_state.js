const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function debugDb() {
    try {
        console.log('--- ALL USERS ---');
        const users = await pool.query('SELECT user_id, username, email FROM users');
        console.table(users.rows);

        console.log('\n--- ALL PENDING ---');
        const pending = await pool.query('SELECT email, full_name, otp_hash FROM pending_registrations');
        console.table(pending.rows);

        console.log('\n--- USERS CONSTRAINTS ---');
        const cons = await pool.query(`
      SELECT conname, pg_get_constraintdef(oid) 
      FROM pg_constraint 
      WHERE conrelid = 'users'::regclass;
    `);
        console.log(cons.rows);

    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}

debugDb();
