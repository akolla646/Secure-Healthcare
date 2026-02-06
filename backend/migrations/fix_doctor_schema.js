const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' }); // Adjust path to reach .env in backend root

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function migrate() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        console.log('1. Adding user_id column to doctors table...');
        await client.query(`
            ALTER TABLE doctors 
            ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(user_id);
        `);

        console.log('2. Populating user_id based on doctor_id matching user_id patterns...');
        // Based on our investigation, for the test data, doctor_id seems to match user_id. 
        // We will try to link them.
        // In a real scenario with separate IDs, we'd need a different strategy, 
        // but the user's setup implies manual creation where IDs might have been pasted or synced.
        // Let's first check if we can match by name or implicit ID link.

        // Actually, the previous check_doctor_users.js showed:
        // User: d164b7e7... (dr_smith)
        // Doctor: d164b7e7... (Dr. Smith)
        // So doctor_id IS the user_id in this dataset.

        await client.query(`
            UPDATE doctors
            SET user_id = doctor_id
            WHERE user_id IS NULL;
        `);

        console.log('3. Verifying update...');
        const res = await client.query('SELECT doctor_id, user_id FROM doctors');
        console.log('Updated doctors:', res.rows);

        await client.query('COMMIT');
        console.log('Migration completed successfully.');

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Migration failed:', err);
    } finally {
        client.release();
        pool.end();
    }
}

migrate();
