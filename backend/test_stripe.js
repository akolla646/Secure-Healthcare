async function testStripe() {
    try {
        const response = await fetch('http://localhost:5000/api/payments/create-checkout-session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer fake_token` // The payment route might be protected
            },
            body: JSON.stringify({
                amount: 50,
                description: 'Consultation with Doctor',
                userId: '30e0ce25-f31b-445d-92de-fcd88df54fb4'
            })
        });

        const data = await response.json();
        console.log("Status:", response.status);
        console.log("Response:", data);
    } catch (e) {
        console.error("Fetch failed:", e);
    }
}
testStripe();
