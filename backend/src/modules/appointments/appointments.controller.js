const appointmentsService = require('./appointments.service');

exports.bookAppointment = async (req, res) => {
  try {
    const result = await appointmentsService.bookAppointment(
      req.body,
      req.user  // will come from auth middleware later
    );

    res.status(201).json(result);
  } catch (err) {
    res.status(err.status || 500).json({
      error: err.message
    });
  }
};
exports.getDoctorAppointments = async (req, res) => {
  try {
    const appointments = await appointmentsService.getDoctorAppointments(
      req.user
    );

    res.status(200).json(appointments);
  } catch (err) {
    console.error("Error fetching doctor appointments:", err); // DEBUG LOG
    res.status(err.status || 500).json({
      error: err.message
    });
  }
};

exports.getMyAppointments = async (req, res) => {
  try {
    const appointments = await appointmentsService.getPatientAppointments(
      req.user
    );
    res.status(200).json(appointments);
  } catch (err) {
    res.status(err.status || 500).json({
      error: err.message
    });
  }
};
