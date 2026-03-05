const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_fLx9QRCDBYi7@ep-spring-sound-a1m8pwb1-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
});

async function findLia() {
    try {
        const res = await pool.query("SELECT id, name, email, role FROM users WHERE name ILIKE '%lia%' OR email ILIKE '%lia%'");
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

findLia();
