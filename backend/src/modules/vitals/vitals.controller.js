const vitalsService = require("./vitals.service");

exports.recordVitals = async (req, res) => {
  try {
    const result = await vitalsService.recordVitals(
      req.body,
      req.user // will come from auth later
    );
    res.status(201).json(result);
  } catch (err) {
    res.status(err.status || 500).json({
      error: err.message
    });
  }
};

exports.getVitalsByAppointment = async (req, res) => {
  try {
    const result = await vitalsService.getVitalsByAppointment(
      req.params.appointment_id,
      req.user
    );
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({
      error: err.message
    });
  }
};

exports.getVitalsByPatient = async (req, res) => {
  try {
    const result = await vitalsService.getVitalsByPatient(
      req.params.patient_id,
      req.user
    );
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({
      error: err.message
    });
  }
};

exports.getMyVitals = async (req, res) => {
  try {
    const result = await vitalsService.getMyVitals(req.user);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({
      error: err.message
    });
  }
};
