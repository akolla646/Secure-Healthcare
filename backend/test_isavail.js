require('dotenv').config();
const repo = require('./src/modules/appointments/appointments.repository');

async function testAvailability() {
    try {
        const _id = 'c357b05a-9753-41a0-9f26-a806eb2db5c3'; // John
        console.log("Input Doctor ID:", _id);
        const doctorUser = await repo.getDoctorUserIdByDoctorId(_id);
        console.log("Resolved user_id:", doctorUser?.user_id);

        const available = await repo.isDoctorAvailable(
            doctorUser.user_id,
            3,
            '11:00:00',
            '11:30:00'
        );
        console.log("Is Available:", available);
    } catch (err) {
        console.error(err);
    }
}
testAvailability();
