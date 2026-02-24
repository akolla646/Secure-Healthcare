// Native fetch is available in Node 18+

async function verifyPayment() {
    try {
        console.log("Sending request to create-checkout-session...");
        const response = await fetch('http://127.0.0.1:5000/api/payments/create-checkout-session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Mocking a token might be needed if I didn't disable auth for testing? 
                // Wait, the route says `authenticate`. I need a token.
                // I will try without token first to see 401, which verifies route exists.
            },
            body: JSON.stringify({
                amount: 100,
                userId: 1,
                description: 'Test Payment'
            })
        });

        console.log(`Response Status: ${response.status}`);
        const data = await response.json(); // or text if not json
        console.log("Response Body:", data);

    } catch (error) {
        console.error("Error:", error.message);
    }
}

verifyPayment();
