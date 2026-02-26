/**
 * Appointments Service
 * Contains business logic for appointment management.
 */

const pool = require("../../config/db");
const repo = require("./appointments.repository");
const { decrypt } = require("../../utils/encryption");

// ============================
// DOCTOR OPERATIONS
// ============================

// Get doctor's appointments (decrypt patient names)
exports.getDoctorAppointments = async (user) => {
  if (user.role !== "DOCTOR") {
    const err = new Error("Only doctors can view their appointments");
    err.status = 403;
    throw err;
  }

  const appointments = await repo.getAppointmentsForDoctor(user.user_id);

  return appointments.map(appt => ({
    ...appt,
    patient_name: appt.patient_name ? decrypt(appt.patient_name) : "Unknown"
  }));
};

// ============================
// PATIENT OPERATIONS
// ============================

// Get logged-in patient's appointments
exports.getPatientAppointments = async (user) => {
  if (user.role !== "PATIENT") {
    const err = new Error("Only patients can view their own appointments");
    err.status = 403;
    throw err;
  }

  const patient = await repo.getPatientIdByUserId(user.user_id);
  if (!patient) {
    const err = new Error("Patient profile not found");
    err.status = 404;
    throw err;
  }

  return await repo.getAppointmentsForPatient(patient.patient_id);
};

// ============================
// BOOKING OPERATIONS
// ============================

// Book new appointment with validations + transaction
exports.bookAppointment = async (data, user) => {
  const {
    doctor_id: inputDoctorId,
    doctor_name,
    scheduled_start,
    scheduled_end,
    reason
  } = data;

  // Resolve patient_id
  const patient = await repo.getPatientIdByUserId(user.user_id);
  if (!patient) {
    const err = new Error("Patient profile not found for this user");
    err.status = 404;
    throw err;
  }
  const patient_id = patient.patient_id;

  // Resolve doctor_id (by ID or name)
  let doctor_id = inputDoctorId;
  if (!doctor_id) {
    const doctor = await repo.getDoctorByName(doctor_name);
    if (!doctor) {
      const err = new Error("Doctor not found");
      err.status = 404;
      throw err;
    }
    doctor_id = doctor.doctor_id;
  }

  // Validate doctor role
  const isDoctor = await repo.isDoctor(doctor_id);
  if (!isDoctor) {
    const err = new Error("User is not a doctor");
    err.status = 400;
    throw err;
  }

  // Validate patient exists
  const patientExists = await repo.patientExists(patient_id);
  if (!patientExists) {
    const err = new Error("Patient not found");
    err.status = 404;
    throw err;
  }

  // Prepare availability check
  const start = new Date(scheduled_start);
  const dayOfWeek = start.getDay(); // 0-6 (Sun-Sat)
  const startTime = scheduled_start.slice(11, 19);
  const endTime = scheduled_end.slice(11, 19);

  // Resolve doctor user_id for availability table
  const doctorUser = await repo.getDoctorUserIdByDoctorId(doctor_id);
  if (!doctorUser) {
    const err = new Error("Doctor user profile not found");
    err.status = 404;
    throw err;
  }

  const available = await repo.isDoctorAvailable(
    doctorUser.user_id,
    dayOfWeek,
    startTime,
    endTime
  );

  if (!available) {
    const err = new Error("Doctor not available at this time");
    err.status = 400;
    throw err;
  }

  // Transaction: insert appointment + audit log
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const appointmentId = await repo.insertAppointment(client, {
      patient_id,
      doctor_id,
      scheduled_start,
      scheduled_end,
      reason
    });

    await repo.insertAuditLog(
      client,
      user.user_id,
      appointmentId,
      "127.0.0.1"
    );

    await client.query("COMMIT");

    return {
      appointment_id: appointmentId,
      status: "SCHEDULED",
      message: "Appointment booked successfully"
    };
  } catch (err) {
    await client.query("ROLLBACK");

    // Handle double-booking constraint
    if (err.code === "23P01") {
      err.message = "Doctor already booked for this slot";
      err.status = 409;
    }

    throw err;
  } finally {
    client.release();
  }
};

// ============================
// AVAILABILITY MANAGEMENT
// ============================

// Update doctor's availability
exports.updateDoctorAvailability = async (user, availabilityData) => {
  if (user.role !== "DOCTOR") {
    const err = new Error("Only doctors can manage availability");
    err.status = 403;
    throw err;
  }

  const userId = user.user_id; // availability table uses user_id

  for (const slot of availabilityData) {
    await repo.upsertDoctorAvailability(
      userId,
      slot.dayOfWeek,
      slot.startTime,
      slot.endTime,
      slot.isActive
    );
  }

  return await repo.getDoctorAvailability(userId);
};

// Get doctor's own availability
exports.getDoctorAvailability = async (user) => {
  if (user.role !== "DOCTOR") {
    const err = new Error("Access denied");
    err.status = 403;
    throw err;
  }

  return await repo.getDoctorAvailability(user.user_id);
};
