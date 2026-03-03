/**
 * Database Configuration
 * Creates and exports a PostgreSQL connection pool (Neon).
 */

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
// Only use SSL for remote/cloud databases (e.g. Neon), not for local PostgreSQL
const isLocal = (process.env.DATABASE_URL || "").includes("localhost") ||
  (process.env.DATABASE_URL || "").includes("127.0.0.1");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isLocal ? false : { rejectUnauthorized: false },
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
