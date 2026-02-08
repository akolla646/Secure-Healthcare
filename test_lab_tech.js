const axios = require('axios');
require('dotenv').config({ path: './backend/.env' });

async function testCreateLabTech() {
    try {
        // 1. Need an admin token. Assuming there's a login endpoint or I can generate one.
        // For simplicity, let's assume we can login as admin first.
        // If not, I'll need to generate a token manually using jsonwebtoken if I have the secret.

        // Let's try to login as admin
        const loginRes = await axios.post('http://localhost:5000/auth/login', {
            username: 'admin', // Assuming default admin from seed
            password: 'adminpassword' // Assuming default
        });

        const token = loginRes.data.token;
        console.log("Got Admin Token");

        // 2. Create Lab Tech
        const res = await axios.post('http://localhost:5000/admin/users', {
            username: 'testlabtech_' + Date.now(),
            email: 'testlabtech_' + Date.now() + '@example.com',
            password: 'password123',
            role: 'LAB_TECH'
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log("Create Response:", res.data);

    } catch (err) {
        console.error("Error:", err.response ? err.response.data : err.message);
    }
}

// Check if we can login, otherwise we might need to simulate a token
// I don't know the admin credentials for sure.
// Alternative: Generate a token directly using the JWT_SECRET from .env

const jwt = require('jsonwebtoken');

function generateAdminToken() {
    const payload = {
        user_id: 'admin-uuid-placeholder', // Doesn't matter much for this test unless DB checks existence
        role: 'ADMIN'
    };
    // Need to read JWT_SECRET
    // It's in process.env
    return jwt.sign(payload, process.env.JWT_SECRET || 'your_jwt_secret', { expiresIn: '1h' });
}

// Actually, let's just use the manual token generation to be safe and avoid login issues
async function testDirect() {
    const token = generateAdminToken();
    console.log("Generated Token:", token);

    try {
        const res = await axios.post('http://localhost:5000/admin/users', {
            username: 'testlabtech_' + Date.now(),
            email: 'testlabtech_' + Date.now() + '@example.com',
            password: 'password123',
            role: 'LAB_TECH'
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log("SUCCESS: Lab Tech Created", res.data);
    } catch (err) {
        console.error("FAILED:", err.response ? err.response.data : err.message);
    }
}

testDirect();
