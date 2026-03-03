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

  console.log("--- BOOKING REQUEST INITIATED ---");
  console.log("Input Doctor ID:", inputDoctorId);
  console.log("Input Doctor Name:", doctor_name);
  console.log("User ID:", user.user_id);

  // 🔐 Step 1: Resolve patient_id from logged-in user
  const patient = await repo.getPatientIdByUserId(user.user_id);
  if (!patient) {
    console.log("Booking failed: Patient not found for user_id", user.user_id);
    const err = new Error("Patient profile not found for this user");
    err.status = 404;
    throw err;
  }
  const patient_id = patient.patient_id;
  console.log("Resolved Patient ID:", patient_id);

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

  // ⏰ Step 5: Validate time range
  // ✅ Step 6: Convert JS day to Database day (0-6)
  // Fix: Extract date string safely and force UTC noon to prevent timezone shifts
  const datePart = scheduled_start.split('T')[0]; // e.g., "2026-02-12"
  const strictDate = new Date(`${datePart}T12:00:00Z`);
  const jsDay = strictDate.getUTCDay(); // JavaScript: 0=Sun, 1=Mon, ..., 6=Sat
  const dayOfWeek = jsDay;

  // Extract time portions for availability check
  const startTime = scheduled_start.slice(11, 19); // HH:MM:SS
  const endTime = scheduled_end.slice(11, 19);

  // 🧪 Debug logging for troubleshooting
  console.log("--- BOOKING DEBUG ---");
  console.log("Received scheduled_start (raw):", scheduled_start);
  console.log("Parsed JS Date object:", strictDate);
  console.log("Calculated JS Day (0=Sun,1=Mon..):", jsDay);
  console.log("Extracted startTime:", startTime);
  console.log("Extracted endTime:", endTime);

  // Step 7: Check doctor availability for this time slot
  // Get the doctor's user_id because doctor_availability table uses user_id in doctor_id column
  const doctorUser = await repo.getDoctorUserIdByDoctorId(doctor_id);

  // Write debug info to file so it can be read regardless of terminal
  const fs = require('fs');
  fs.appendFileSync('book_debug.log', `[${new Date().toISOString()}] Start: ${scheduled_start}, Day: ${jsDay}, StartTime: ${startTime}, EndTime: ${endTime}, DoctorID: ${doctor_id}, DoctorUserID: ${doctorUser?.user_id}\n`);

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

  console.log("Is Available DB Result:", available);
  fs.appendFileSync('book_debug.log', `-> IsAvailable: ${available}\n`);

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
