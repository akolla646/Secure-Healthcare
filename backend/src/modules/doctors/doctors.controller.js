const service = require("./doctors.service");

exports.getAllDoctors = async (req, res) => {
    try {
        console.log("Doctors: Received request to fetch doctors");
        const doctors = await service.getAllDoctors();
        console.log("Doctors: Found", doctors.length, "doctors");
        res.json(doctors);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
