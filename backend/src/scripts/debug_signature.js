const { Pool } = require("pg");
const path = require('path');
const crypto = require('crypto');
require("dotenv").config({ path: path.join(__dirname, '../../.env') });

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});

const verifySignature = (hash, signature, publicKeyPem) => {
    try {
        return crypto.verify(
            "sha256",
            Buffer.from(hash),
            publicKeyPem,
            Buffer.from(signature, "base64")
        );
    } catch (e) {
        console.log("Crypto Verify Error:", e.message);
        return false;
    }
};

const main = async () => {
    const client = await pool.connect();
    try {
        // 1. Get latest report
        const res = await client.query("SELECT * FROM lab_reports ORDER BY created_at DESC LIMIT 1");
        if (res.rows.length === 0) return console.log("No reports");
        const report = res.rows[0];
        console.log(`Checking Report ID: ${report.report_id}`);
        console.log(`Report Hash: ${report.report_hash}`);
        let signature = report.lab_tech_signature;
        if (Buffer.isBuffer(signature)) {
            console.log("Info: Signature is a Buffer. converting to utf8 string (assuming base64 stored as bytes) or passing as is?");
            // If it was stored as Base64 string put into a text column, it's a string.
            // If it was stored as Base64 string put into a BYTEA column, it's a Buffer of the ASCII chars of the base64.
            // verifySignature expects a Base64 String.
            signature = signature.toString('utf8');
        }
        console.log(`Signature Type: ${typeof signature}`);
        console.log(`Signature (first 20 chars): ${signature.substring(0, 20)}...`);

        // 2. Get Lab Tech Public Key from DB
        const orderRes = await client.query("SELECT lab_tech_id FROM lab_orders WHERE order_id = $1", [report.order_id]);
        const labTechId = orderRes.rows[0].lab_tech_id;

        const keyRes = await client.query("SELECT public_key_pem FROM user_public_keys WHERE user_id = $1", [labTechId]);
        if (keyRes.rows.length === 0) return console.log("No public key in DB");
        const dbPublicKey = keyRes.rows[0].public_key_pem;

        console.log(`\nVerifying with DB Public Key...`);
        const validDb = verifySignature(report.report_hash, signature, dbPublicKey);
        console.log(`Result: ${validDb ? "✅ VALID" : "❌ INVALID"}`);

        // 3. Check with ENV derived key (to see if DB key is wrong vs Env key)
        const envPrivateKey = process.env.LAB_PRIVATE_KEY.replace(/\\n/g, '\n');
        const envPublicKeyObj = crypto.createPublicKey(envPrivateKey);
        const envPublicKey = envPublicKeyObj.export({ type: 'spki', format: 'pem' });

        console.log(`\nVerifying with ENV Derived Public Key...`);
        if (dbPublicKey.trim() !== envPublicKey.trim()) {
            console.log("⚠️ DB Key and ENV Key are DIFFERENT strings.");
            // Print diff?
        } else {
            console.log("Info: DB Key and ENV Key match.");
        }

        const validEnv = verifySignature(report.report_hash, signature, envPublicKey);
        console.log(`Result: ${validEnv ? "✅ VALID" : "❌ INVALID"}`);

    } finally {
        client.release();
        pool.end();
    }
};

main();
