/**
 * Database Configuration
 * Creates and exports a PostgreSQL connection pool (Neon).
 */

const { Pool } = require("pg");

// Create connection pool using DATABASE_URL from .env
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Required for Neon SSL
  },
});

// Test connection at startup
pool.connect()
  .then(() => console.log("PostgreSQL (Neon) connected ✅"))
  .catch((err) => {
    console.error("PostgreSQL connection failed ❌");
    console.error(err);
  });

// Export pool for queries
module.exports = pool;
