/**
 * Database Configuration
 * Creates and exports a PostgreSQL connection pool (Neon).
 */

const { Pool } = require("pg");

// Create connection pool using DATABASE_URL from .env
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Required for Neon serverless PostgreSQL - allows self-signed certificates
  },
});

// Test connection at startup
pool.connect()
  .then(() => console.log("PostgreSQL (Neon) connected successfully ✅"))
  .catch((err) => {
    console.error("PostgreSQL connection failed ❌");
    console.error(err);
  });

// Export the pool for use in other modules (repositories, services)
module.exports = pool;
