const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function testConnection() {
    try {
        console.log("Attempting to connect to the database...");
        const client = await pool.connect();
        console.log("Connection successful!");
        const res = await client.query('SELECT NOW()');
        console.log("Database time:", res.rows[0].now);
        client.release();
    } catch (err) {
        console.error("Connection failed:", err.message);
    } finally {
        pool.end();
    }
}

testConnection();
