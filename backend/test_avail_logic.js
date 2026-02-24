const repo = require('./src/modules/appointments/appointments.repository');

async function testAvail() {
    // Hardcoding user_id mapped to the doctor directly for testing
    const doctorUserId = "5fc9f9ba-8c78-4746-acc3-70e3c05b4f97";

    // Test parameters that simulate a booking request on Thursday (JS Day 4) at 9:00 AM
    const scheduled_start = "2026-02-12T09:00:00.000Z";
    const scheduled_end = "2026-02-12T09:30:00.000Z";

    const start = new Date(scheduled_start);
    const jsDayOfWeek = start.getDay();

    let startTime = scheduled_start.slice(11, 19);
    let endTime = scheduled_end.slice(11, 19);

    console.log("Input scheduled_start:", scheduled_start);
    console.log("Calculated dayOfWeek:", jsDayOfWeek);
    console.log("Extracted startTime:", startTime);
    console.log("Extracted endTime:", endTime);

    try {
        const available = await repo.isDoctorAvailable(
            doctorUserId,
            jsDayOfWeek,
            startTime,
            endTime
        );
        console.log("Is Available (JS Day):", available);
    } catch (e) {
        console.error(e);
    }
}

testAvail();
