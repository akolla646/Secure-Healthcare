const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, 'backend/.env') });

const { encrypt } = require('./backend/src/utils/encryption');
const { hashData, signHash } = require('./backend/src/utils/digitalSignature');

async function debug() {
    console.log('--- DEBUG START ---');

    // 1. Check Env
    const labKey = process.env.LAB_PRIVATE_KEY;
    if (!labKey) {
        console.error('❌ LAB_PRIVATE_KEY is missing');
        return;
    }
    console.log('✅ LAB_PRIVATE_KEY found (length:', labKey.length, ')');

    // Format key
    const formattedKey = labKey.replace(/\\n/g, '\n');
    console.log('Key first line:', formattedKey.split('\n')[0]);

    // 2. Encryption
    try {
        const text = JSON.stringify({ test: "value" });
        const encrypted = encrypt(text);
        console.log('✅ Encryption successful:', encrypted.substring(0, 20) + '...');

        // 3. Hashing
        const hash = hashData(encrypted);
        console.log('✅ Hashing successful:', hash);

        // 4. Signing
        try {
            const signature = signHash(hash, formattedKey);
            console.log('✅ Signing successful:', signature.substring(0, 20) + '...');
        } catch (err) {
            console.error('❌ Signing failed:', err.message);
            // Print details about key
            console.log('Formatted Key Preview:\n', formattedKey.substring(0, 50));
        }
    } catch (err) {
        console.error('❌ Encryption/Hashing failed:', err.message);
    }
    console.log('--- DEBUG END ---');
}

debug();
