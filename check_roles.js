const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, 'backend/.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function checkRoles() {
    try {
        const res = await pool.query('SELECT role_name FROM roles');
        console.log('Roles:', res.rows.map(r => r.role_name));
    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}

checkRoles();
