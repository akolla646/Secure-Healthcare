async function testRegistration() {
    try {
        const response = await fetch('http://localhost:5000/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: "Test User",
                email: "test@example.com",
                password: "password123",
                role: "PATIENT",
                dob: "1990-01-01",
                gender: "Male",
                blood_group: "O+"
            })
        });

        const data = await response.json();
        console.log("Response Status:", response.status);
        console.log("Response Data:", data);
    } catch (e) {
        console.error("Fetch failed:", e);
    }
}
testRegistration();
