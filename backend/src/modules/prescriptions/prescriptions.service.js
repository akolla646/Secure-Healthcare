const pool = require("../../config/db");
const repo = require("./prescriptions.repository");

exports.createPrescription = async (data, user) => {
  const {
    appointment_id,
    medication_id,
    dosage,
    frequency,
    start_date,
    end_date
  } = data;

const doctorId = user?.user_id || data.doctor_id;

  // 1️⃣ Doctor-only
  const isDoctor = await repo.isDoctor(doctorId);
  if (!isDoctor) {
    const err = new Error("Only doctors can prescribe medication");
    err.status = 403;
    throw err;
  }

  // 2️⃣ Validate appointment
  const appointment = await repo.getAppointment(appointment_id);
  if (!appointment) {
    const err = new Error("Appointment not found");
    err.status = 404;
    throw err;
  }

  if (appointment.doctor_id !== doctorId) {
    const err = new Error("Doctor not assigned to this appointment");
    err.status = 403;
    throw err;
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 3️⃣ Insert prescription
    const prescriptionId = await repo.insertPrescription(client, {
      appointment_id,
      patient_id: appointment.patient_id,
      doctor_id: doctorId,
      medication_id,
      dosage,
      frequency,
      start_date,
      end_date
    });

    // 4️⃣ Audit log
    await repo.insertAudit(client, doctorId, prescriptionId);

    await client.query("COMMIT");

    return {
      prescription_id: prescriptionId,
      message: "Prescription created successfully"
    };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

exports.getByAppointment = async (appointmentId, user) => {
  return {
    appointment_id: appointmentId,
    prescriptions: await repo.getByAppointment(appointmentId)
  };
};

exports.getByPatient = async (patientId, user) => {
  // Patient can only see own prescriptions
  if (user?.role === "PATIENT" && user.patient_id !== patientId) {
    const err = new Error("Access denied");
    err.status = 403;
    throw err;
  }

  return {
    patient_id: patientId,
    prescriptions: await repo.getByPatient(patientId)
  };
};
