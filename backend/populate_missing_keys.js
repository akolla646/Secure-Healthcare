const path = require("path");
const crypto = require("crypto");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });
const pool = require("./src/config/db");

async function populateKeys() {
    try {
        console.log("Starting public key population...");

        // 1. Get Private Key from ENV
        if (!process.env.LAB_PRIVATE_KEY) {
            throw new Error("LAB_PRIVATE_KEY not found in .env");
        }

        const labPrivKeyPem = process.env.LAB_PRIVATE_KEY.replace(/\\n/g, '\n');

        // 2. Derive Public Key
        const labPubKey = crypto.createPublicKey(labPrivKeyPem);
        const labPubKeyPem = labPubKey.export({ type: 'spki', format: 'pem' });

        console.log("Derived Public Key from .env successful.");

        // 3. Identified Users who need this key
        const targets = [
            { id: '3ed4892d-b6a3-4a74-84c5-3a0ae449e79d', name: 'Lab Tech (Akshara)' },
            { id: '5fc9f9ba-8c78-4746-acc3-70e3c05b4f97', name: 'Doctor (Akshara)' }
        ];

        for (const target of targets) {
            console.log(`Processing ${target.name} (${target.id})...`);

            const query = `
        INSERT INTO user_public_keys (user_id, public_key_pem)
        VALUES ($1, $2)
        ON CONFLICT (user_id) DO UPDATE SET public_key_pem = $2
      `;

            await pool.query(query, [target.id, labPubKeyPem]);
            console.log(`✅ Success for ${target.name}`);
        }

        console.log("\nAll keys populated successfully.");

    } catch (err) {
        console.error("❌ Population failed:", err.message);
    } finally {
        await pool.end();
    }
}

populateKeys();
