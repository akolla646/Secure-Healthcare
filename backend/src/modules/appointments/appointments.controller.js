/**
 * Appointments Controller
 * Handles HTTP logic and delegates business rules to the service layer.
 */

const appointmentsService = require('./appointments.service');

// ============================
// PATIENT ENDPOINTS
// ============================

// POST /appointments/ - Book appointment
exports.bookAppointment = async (req, res) => {
  try {
    const result = await appointmentsService.bookAppointment(
      req.body,
      req.user
    );
    res.status(201).json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
};

// ============================
// DOCTOR ENDPOINTS
// ============================

// GET /appointments/doctor - Doctor's appointments
exports.getDoctorAppointments = async (req, res) => {
  try {
    const appointments = await appointmentsService.getDoctorAppointments(
      req.user
    );
    res.status(200).json(appointments);
  } catch (err) {
    console.error("Error fetching doctor appointments:", err);
    res.status(err.status || 500).json({ error: err.message });
  }
};

// GET /appointments/my-appointments - Patient's appointments
exports.getMyAppointments = async (req, res) => {
  try {
    const appointments = await appointmentsService.getPatientAppointments(
      req.user
    );
    res.status(200).json(appointments);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
};

// ============================
// AVAILABILITY MANAGEMENT
// ============================

// POST /appointments/availability - Update doctor schedule
exports.updateAvailability = async (req, res) => {
  try {
    const updatedSchedule = await appointmentsService.updateDoctorAvailability(
      req.user,
      req.body
    );
    res.status(200).json(updatedSchedule);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
};

// GET /appointments/availability - Get doctor schedule
exports.getAvailability = async (req, res) => {
  try {
    const schedule = await appointmentsService.getDoctorAvailability(req.user);
    res.status(200).json(schedule);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
};
