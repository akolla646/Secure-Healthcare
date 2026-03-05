const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function querySchema() {
    try {
        console.log("Connecting...");
        const client = await pool.connect();

        const res = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'vitals';
        `);
        console.table(res.rows);
        client.release();
    } catch (err) {
        console.error("Failed:", err.message);
    } finally {
        pool.end();
    }
}

querySchema();
