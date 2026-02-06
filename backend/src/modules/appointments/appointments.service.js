const pool = require("../../config/db");
const repo = require("./appointments.repository");

const { decrypt } = require("../../utils/encryption");

/**
 * Doctor views their appointments
 */
exports.getDoctorAppointments = async (user) => {
  if (user.role !== "DOCTOR") {
    const err = new Error("Only doctors can view their appointments");
    err.status = 403;
    throw err;
  }

  const appointments = await repo.getAppointmentsForDoctor(user.user_id);

  return appointments.map(appt => ({
    ...appt,
    patient_name: appt.patient_name ? decrypt(appt.patient_name) : 'Unknown'
  }));
};

/**
 * Patient views their own appointments
 */
exports.getPatientAppointments = async (user) => {
  if (user.role !== "PATIENT") {
    const err = new Error("Only patients can view their own appointments");
    err.status = 403;
    throw err;
  }

  // Resolve patient_id
  const patient = await repo.getPatientIdByUserId(user.user_id);
  if (!patient) {
    const err = new Error("Patient profile not found");
    err.status = 404;
    throw err;
  }

  return await repo.getAppointmentsForPatient(patient.patient_id);
};

/**
 * Book appointment (FULL LOGIC)
 */
exports.bookAppointment = async (data, user) => {
  const {
    doctor_id: inputDoctorId,
    doctor_name,
    scheduled_start,
    scheduled_end,
    reason
  } = data;

  // 🔐 Resolve patient_id from logged-in user
  const patient = await repo.getPatientIdByUserId(user.user_id);
  if (!patient) {
    const err = new Error("Patient profile not found for this user");
    err.status = 404;
    throw err;
  }
  const patient_id = patient.patient_id;

  // 🔎 Resolve doctor_id
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

  // 🩺 Validate doctor role
  const isDoctor = await repo.isDoctor(doctor_id);
  if (!isDoctor) {
    const err = new Error("User is not a doctor");
    err.status = 400;
    throw err;
  }

  // 👤 Validate patient exists (safety)
  const patientExists = await repo.patientExists(patient_id);
  if (!patientExists) {
    const err = new Error("Patient not found");
    err.status = 404;
    throw err;
  }

  // ⏰ Time checks
  const start = new Date(scheduled_start);
  const end = new Date(scheduled_end);

  if (end <= start) {
    const err = new Error("Invalid appointment time range");
    err.status = 400;
    throw err;
  }

  // ✅ Convert JS day → DB day (Mon=1 … Sun=7)
  const jsDay = start.getDay(); // 0–6
  const dayOfWeek = jsDay === 0 ? 7 : jsDay;

  const startTime = scheduled_start.slice(11, 19);
  const endTime = scheduled_end.slice(11, 19);

  // 🧪 DEBUG (safe position)
  console.log({
    doctor_id,
    dayOfWeek,
    startTime,
    endTime
  });

  const available = await repo.isDoctorAvailable(
    doctor_id,
    dayOfWeek,
    startTime,
    endTime
  );

  if (!available) {
    const err = new Error("Doctor not available at this time");
    err.status = 400;
    throw err;
  }

  // 🔁 Transaction
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

    if (err.code === "23P01") {
      err.message = "Doctor already booked for this slot";
      err.status = 409;
    }

    throw err;
  } finally {
    client.release();
  }
};

