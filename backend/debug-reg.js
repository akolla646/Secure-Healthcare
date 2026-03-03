const data = {
    name: "praveen",
    email: "nelluripraveen00@gmail.com",
    password: "password123",
    role: "Patient",
    dob: "2009-12-12",
    gender: "Male",
    blood_group: "A+"
};

async function testRegister() {
    try {
        const response = await fetch('http://localhost:5000/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const text = await response.text();
        try {
            const json = JSON.parse(text);
            console.log('Status:', response.status);
            console.log('Response:', JSON.stringify(json, null, 2));
        } catch (e) {
            console.log('Status:', response.status);
            console.log('Body:', text);
        }
    } catch (error) {
        console.log('Network Error:', error.message);
    }
}

testRegister();
