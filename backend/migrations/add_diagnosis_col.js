const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const pool = require('../src/config/db');

async function migrate() {
    const client = await pool.connect();
    try {
        console.log('Starting migration: Add diagnosis column to lab_reports');
        await client.query('BEGIN');

        // Check if column exists
        const res = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='lab_reports' AND column_name='diagnosis'
    `);

        if (res.rowCount === 0) {
            await client.query(`
        ALTER TABLE lab_reports 
        ADD COLUMN diagnosis TEXT
      `);
            console.log('Added diagnosis column.');
        } else {
            console.log('Diagnosis column already exists.');
        }

        await client.query('COMMIT');
        console.log('Migration completed successfully.');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Migration failed:', err);
    } finally {
        client.release();
        pool.end(); // Close pool to exit script
    }
}

migrate();
