const service = require("./prescriptions.service");

exports.createPrescription = async (req, res) => {
  try {
    const result = await service.createPrescription(req.body, req.user);
    res.status(201).json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
};

exports.getByAppointment = async (req, res) => {
  try {
    const result = await service.getByAppointment(
      req.params.appointment_id,
      req.user
    );
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
};

exports.getByPatient = async (req, res) => {
  try {
    const result = await service.getByPatient(
      req.params.patient_id,
      req.user
    );
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
};
