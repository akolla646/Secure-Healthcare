const { Pool } = require('pg');
require('dotenv').config();

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

        console.log("Checking if column exists...");
        const CheckCol = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='lab_orders' AND column_name='test_name'
        `);

        if (CheckCol.rowCount === 0) {
            console.log("Adding test_name column...");
            await client.query(`ALTER TABLE lab_orders ADD COLUMN test_name TEXT`);
        } else {
            console.log("Column test_name already exists.");
        }

        console.log("Backfilling data...");
        // Update records where test_name is NULL
        // For backfill, user requested "Complete Blood Count" (or similar)
        // We can also try to join with lab_test_catalog if test_id exists to be more accurate, 
        // but user said "fill prev entries... as blood count".
        // Let's try to be smart: if test_id matches catalog, use that name. If not (or test_id is null), use 'Complete Blood Count'.

        await client.query(`
            UPDATE lab_orders lo
            SET test_name = COALESCE(ltc.test_name, 'Complete Blood Count')
            FROM lab_test_catalog ltc
            WHERE lo.test_id = ltc.test_id
              AND lo.test_name IS NULL
        `);

        // Handle cases where test_id might be null or no match found in catalog (fallback)
        await client.query(`
            UPDATE lab_orders
            SET test_name = 'Complete Blood Count'
            WHERE test_name IS NULL
        `);

        await client.query('COMMIT');
        console.log("Migration successful.");

    } catch (err) {
        await client.query('ROLLBACK');
        console.error("Migration failed:", err);
    } finally {
        client.release();
        pool.end();
    }
}

migrate();
