require("dotenv").config();
const pool = require('./src/config/db');

async function check() {
    try {
        const q = `
      SELECT conname, pg_get_constraintdef(c.oid)
      FROM pg_constraint c
      JOIN pg_namespace n ON n.oid = c.connamespace
      WHERE conrelid = 'pending_registrations'::regclass
    `;
        const res = await pool.query(q);
        console.log("CONSTRAINTS:", res.rows);
    } catch (err) {
        console.error("Error:", err);
    } finally {
        process.exit(0);
    }
}

check();
