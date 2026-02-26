const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function checkSchema() {
    try {
        const client = await pool.connect();

        console.log("--- Doctors Table Columns ---");
        const doctorsCols = await client.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'doctors'
        `);
        console.table(doctorsCols.rows);

        console.log("\n--- Doctors Table Constraints ---");
        const doctorsConstraints = await client.query(`
            SELECT con.conname, con.contype, kcu.column_name, ccu.table_name AS foreign_table_name, ccu.column_name AS foreign_column_name
            FROM pg_constraint con 
            JOIN pg_class rel ON rel.oid = con.conrelid 
            JOIN pg_namespace nsp ON nsp.oid = connamespace 
            JOIN pg_attribute a ON a.attnum = ANY(con.conkey) AND a.attrelid = con.conrelid
            JOIN information_schema.key_column_usage kcu ON kcu.constraint_name = con.conname
            LEFT JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = con.conname
            WHERE rel.relname = 'doctors'
        `);
        // Note: The above query might be a bit complex/buggy for simple inspection, let's stick to simpler approach if this fails. 
        // But let's try a simpler one for constraints.
        const simpleConstraints = await client.query(`
            SELECT
                tc.constraint_name, 
                tc.constraint_type, 
                kcu.column_name, 
                ccu.table_name AS foreign_table_name,
                ccu.column_name AS foreign_column_name 
            FROM 
                information_schema.table_constraints AS tc 
                JOIN information_schema.key_column_usage AS kcu
                  ON tc.constraint_name = kcu.constraint_name
                  AND tc.table_schema = kcu.table_schema
                JOIN information_schema.constraint_column_usage AS ccu
                  ON ccu.constraint_name = tc.constraint_name
                  AND ccu.table_schema = tc.table_schema
            WHERE tc.table_name = 'doctors';
        `);
        console.table(simpleConstraints.rows);

        console.log("\n--- Tables referencing Doctors ---");
        // Find FKs pointing to doctors
        const references = await client.query(`
            SELECT
                tc.table_name, 
                kcu.column_name, 
                tc.constraint_name
            FROM 
                information_schema.table_constraints AS tc 
                JOIN information_schema.key_column_usage AS kcu
                  ON tc.constraint_name = kcu.constraint_name
                  AND tc.table_schema = kcu.table_schema
                JOIN information_schema.constraint_column_usage AS ccu
                  ON ccu.constraint_name = tc.constraint_name
                  AND ccu.table_schema = tc.table_schema
            WHERE ccu.table_name = 'doctors';
        `);
        console.table(references.rows);

        client.release();
    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}

checkSchema();
