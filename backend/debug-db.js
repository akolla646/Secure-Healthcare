const { Pool } = require('pg');
require('dotenv').config();

console.log("Testing DB Connection...");
console.log("DATABASE_URL:", process.env.DATABASE_URL ? "Defined" : "Undefined");

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function testConnection() {
    try {
        const client = await pool.connect();
        console.log("Connected successfully!");
        const res = await client.query('SELECT NOW()');
        console.log("Server Time:", res.rows[0].now);
        client.release();
    } catch (err) {
        console.error("Connection Failed:", err);
    } finally {
        await pool.end();
    }
}

testConnection();
