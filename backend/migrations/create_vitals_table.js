/**
 * Migration: Create Vitals Table
 * 
 * Creates the `vitals` table for permanently storing patient health data.
 * This table is separate from the existing `vital_signs` table used in Sprint 1.
 * 
 * Usage: node migrations/create_vitals_table.js
 * 
 * @module migrations/create_vitals_table
 */

const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const { Pool } = require("pg");

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

const CREATE_VITALS_TABLE = `
  CREATE TABLE IF NOT EXISTS vitals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL,
    heart_rate INTEGER,
    blood_pressure TEXT,
    temperature DECIMAL,
    spo2 INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
  );
`;

const CREATE_INDEX = `
  CREATE INDEX IF NOT EXISTS idx_vitals_patient_id ON vitals (patient_id);
`;

async function migrate() {
    console.log("🚀 Running migration: Create vitals table...\n");

    let client;
    try {
        client = await pool.connect();

        await client.query("BEGIN");
        await client.query(CREATE_VITALS_TABLE);
        await client.query(CREATE_INDEX);
        await client.query("COMMIT");

        console.log("✅ Migration completed successfully!");
        console.log("   - Table 'vitals' created (or already exists)");
        console.log("   - Index 'idx_vitals_patient_id' created (or already exists)\n");

        // Verify table exists
        const result = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'vitals'
      ORDER BY ordinal_position
    `);

        console.log("📋 Table Schema:");
        result.rows.forEach((col) => {
            console.log(`   ${col.column_name} | ${col.data_type} | nullable: ${col.is_nullable}`);
        });

    } catch (err) {
        console.error("❌ Migration FAILED:");
        console.error(`   ${err.message}`);
        process.exit(1);
    } finally {
        if (client) client.release();
        await pool.end();
    }
}

migrate();
