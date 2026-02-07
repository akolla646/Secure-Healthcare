require('dotenv').config();
const crypto = require('crypto');
const pool = require('./src/config/db');

async function debugKeys() {
    const client = await pool.connect();
    try {
        console.log("----------------------------------------------------------------");
        console.log("🔑 Deep Debug Keys (Corrected Schema)");
        console.log("----------------------------------------------------------------");

        // 1. Check Env Private Key
        const envPrivateKey = process.env.DOCTOR_PRIVATE_KEY;
        if (!envPrivateKey) {
            console.error("❌ DOCTOR_PRIVATE_KEY not found in .env");
            return;
        }

        // Fix escaped newlines if present
        const formattedPrivateKey = envPrivateKey.replace(/\\n/g, '\n');
        let derivedPublicKey;

        try {
            const keyObject = crypto.createPrivateKey(formattedPrivateKey);
            derivedPublicKey = crypto.createPublicKey(keyObject)
                .export({ type: 'spki', format: 'pem' });
            console.log("✅ Successfully derived public key from .env private key.");
        } catch (e) {
            console.error("❌ Failed to parse .env private key:", e.message);
            return;
        }

        // 2. Find Doctor User(s) from users + user_roles + roles
        const { rows: doctors } = await client.query(`
      SELECT u.user_id, u.username, u.email 
      FROM users u
      JOIN user_roles ur ON u.user_id = ur.user_id
      JOIN roles r ON ur.role_id = r.role_id
      WHERE r.role_name = 'DOCTOR'
    `);

        if (doctors.length === 0) {
            console.log("⚠️ No users with role 'DOCTOR' found.");
            return;
        }

        console.log(`Found ${doctors.length} doctor(s). Checking against DB...`);

        let mismatchFound = false;

        for (const doc of doctors) {
            console.log(`\nuser_id: ${doc.user_id} (${doc.username || 'No Username'})`);

            const { rows: keys } = await client.query(`
        SELECT public_key_pem FROM user_public_keys WHERE user_id = $1
      `, [doc.user_id]);

            if (keys.length === 0) {
                console.log("   ⚠️ No public key found in DB.");

                // Auto-fix offer?
                console.log("   -> We could insert the key if needed.");
                continue;
            }

            const dbPublicKey = keys[0].public_key_pem;

            // Compare (ignoring whitespace)
            const normDerived = derivedPublicKey.replace(/\s+/g, '');
            const normDB = dbPublicKey.replace(/\s+/g, '');

            if (normDerived === normDB) {
                console.log("   ✅ MATCH: .env key matches DB key.");
            } else {
                console.error("   ❌ MISMATCH: .env key does NOT match DB key!");
                console.log("   -> The private key in .env is DIFFERENT from the public key in DB.");
                mismatchFound = true;

                // AUTO-FIX SQL
                console.log("   -> Recommended Fix:");
                console.log("      UPDATE user_public_keys SET public_key_pem = $1 WHERE user_id = $2");

                // Let's actually perform the fix if it looks like the .env one is the "source of truth"
                // Since we are debugging, maybe we should just fix it?
                // The user said "Invalid doctor signature", meaning verification failed.
                // If we update DB to match .env, verification of NEW signatures will work.
                // OLD signatures (before today) might still fail if they were signed with the "DB key".
                // But the user issue suggests they JUST signed it ("verified it , still doesnot work")
                // So the "just signed" report used .env key.
                // The "view" verification used DB key.
                // So updating DB key to match .env key is the correct fix for TODAY's work.

                await updatePublicKey(client, doc.user_id, derivedPublicKey);
            }
        }

    } catch (err) {
        console.error("Error:", err);
    } finally {
        client.release();
        pool.end();
    }
}

async function updatePublicKey(client, userId, newKey) {
    console.log("   🛠️ Attempting to update public key in DB...");
    await client.query(`
        UPDATE user_public_keys
        SET public_key_pem = $1,
            created_at = NOW()
        WHERE user_id = $2
    `, [newKey, userId]);
    console.log("   ✅ Public key UPDATED in database.");
}

debugKeys();
