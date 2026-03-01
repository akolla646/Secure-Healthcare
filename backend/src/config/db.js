/**
 * Database Configuration Module
 * 
 * This module establishes and exports a connection pool to the PostgreSQL
 * database hosted on Neon (serverless PostgreSQL). It uses the 'pg' library
 * to create a connection pool that can handle multiple concurrent queries.
 * 
 * @module config/db
 */

// Import the Pool class from pg library for connection pooling
const { Pool } = require("pg");

/**
 * PostgreSQL Connection Pool
 * 
 * Creates a new connection pool using the DATABASE_URL from environment variables.
 * The pool manages multiple connections and reuses them for efficiency.
 * 
 * Configuration:
 * - connectionString: The full database connection URL from .env
 * - ssl.rejectUnauthorized: Set to false for Neon serverless PostgreSQL compatibility
 */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Required for Neon serverless PostgreSQL - allows self-signed certificates
  },
});

/**
 * Handle Pool-Level Errors
 * 
 * Neon serverless PostgreSQL may close idle connections at any time.
 * Without this handler, the pool emits an unhandled 'error' event
 * which crashes the Node.js process.
 */
pool.on("error", (err) => {
  console.error("⚠️  Unexpected pool error (Neon may have closed an idle connection):", err.message);
});

/**
 * Test Database Connection
 * 
 * Attempts to establish a connection when the module loads.
 * The client MUST be released back to the pool after testing,
 * otherwise the idle connection will be terminated by Neon
 * and trigger an unhandled error.
 */
pool.connect()
  .then((client) => {
    console.log("PostgreSQL (Neon) connected successfully ✅");
    client.release(); // Release the client back to the pool
  })
  .catch((err) => {
    console.error("PostgreSQL connection failed ❌");
    console.error(err);
  });

// Export the pool for use in other modules (repositories, services)
module.exports = pool;
