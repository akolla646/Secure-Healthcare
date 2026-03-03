async function testBooking() {
    try {
        const response = await fetch('http://localhost:5000/api/appointments/book', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer test_token_or_anything'
            },
            body: JSON.stringify({
                doctor_id: "2a230aad-f156-4a2a-ad06-2071ff78920b",
                scheduled_start: "2026-02-12T09:00:00",
                scheduled_end: "2026-02-12T09:30:00",
                reason: "Checkup"
            })
        });

        const data = await response.json();
        console.log("Response Status:", response.status);
        console.log("Response Data:", data);
    } catch (e) {
        console.error("Fetch failed:", e);
    }
}
testBooking();
