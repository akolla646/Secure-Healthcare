/**
 * Database Connection Test Script
 * 
 * Tests connectivity to Neon PostgreSQL using the pg library
 * and the DATABASE_URL from the .env file.
 * 
 * Usage: node scripts/test-db-connection.js
 * 
 * @module scripts/test-db-connection
 */

const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const { Pool } = require("pg");

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

async function testConnection() {
    console.log("🔌 Testing Neon PostgreSQL connection...\n");

    if (!process.env.DATABASE_URL) {
        console.error("❌ DATABASE_URL is not set in .env");
        process.exit(1);
    }

    let client;
    try {
        client = await pool.connect();
        console.log("✅ Successfully connected to Neon PostgreSQL!\n");

        // Print server version
        const result = await client.query("SELECT version()");
        console.log("📦 Server Version:");
        console.log(`   ${result.rows[0].version}\n`);

        // Print current timestamp from server
        const timeResult = await client.query("SELECT NOW() AS server_time");
        console.log("🕐 Server Time:");
        console.log(`   ${timeResult.rows[0].server_time}\n`);

        console.log("🎉 Database connection test PASSED!");
    } catch (err) {
        console.error("❌ Database connection FAILED:");
        console.error(`   ${err.message}\n`);
        process.exit(1);
    } finally {
        if (client) client.release();
        await pool.end();
    }
}

testConnection();
