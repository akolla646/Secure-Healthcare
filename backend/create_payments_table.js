const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // Required for Neon
});

async function createPaymentsTable() {
  try {
    console.log("Connecting to database...");
    const client = await pool.connect();

    console.log("Creating payments table...");
    await client.query(`
            CREATE TABLE IF NOT EXISTS payments (
                id SERIAL PRIMARY KEY,
                user_id UUID NOT NULL, -- Assuming UUID from your other tables
                amount DECIMAL(10, 2) NOT NULL,
                currency VARCHAR(3) DEFAULT 'usd',
                stripe_session_id VARCHAR(255) UNIQUE,
                status VARCHAR(20) DEFAULT 'PENDING',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                description TEXT
            );
        `);

    console.log("Payments table created successfully!");
    client.release();
  } catch (err) {
    console.error("Failed to create table:", err);
  } finally {
    pool.end();
  }
}

createPaymentsTable();
