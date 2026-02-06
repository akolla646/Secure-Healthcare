const pool = require("../../config/db");
const repo = require("./vitals.repository");

exports.recordVitals = async (data, user) => {
  const {
    appointment_id,
    patient_id,
    heart_rate,
    bp_systolic,
    bp_diastolic,
    temperature,
    respiratory_rate,
    oxygen_saturation,
    recorded_by
  } = data;

  const actorUserId = user?.user_id || recorded_by;

  // 1️⃣ Role check
  const allowed = await repo.isClinician(actorUserId);
  if (!allowed) {
    const err = new Error("Only doctors or nurses can record vitals");
    err.status = 403;
    throw err;
  }

  // 2️⃣ Appointment validation
  const appointment = await repo.getAppointment(appointment_id);
  if (!appointment) {
    const err = new Error("Appointment not found");
    err.status = 404;
    throw err;
  }

  if (appointment.patient_id !== patient_id) {
    const err = new Error("Patient does not match appointment");
    err.status = 400;
    throw err;
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 3️⃣ Insert vitals
    const vitalId = await repo.insertVitals(client, {
      appointment_id,
      patient_id,
      recorded_by: actorUserId,
      heart_rate,
      bp_systolic,
      bp_diastolic,
      temperature,
      respiratory_rate,
      oxygen_saturation
    });

    // 4️⃣ Audit log
    await repo.insertAudit(client, actorUserId, vitalId);

    await client.query("COMMIT");

    return {
      vital_id: vitalId,
      message: "Vitals recorded successfully"
    };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

exports.getVitalsByAppointment = async (appointmentId, user) => {
  const appointment = await repo.getAppointment(appointmentId);
  if (!appointment) {
    const err = new Error("Appointment not found");
    err.status = 404;
    throw err;
  }

  // Patient can view only own appointment
  if (user?.role === "PATIENT" && user.patient_id !== appointment.patient_id) {
    const err = new Error("Access denied");
    err.status = 403;
    throw err;
  }

  return {
    appointment_id: appointmentId,
    vitals: await repo.getAppointmentVitals(appointmentId)
  };
};

exports.getVitalsByPatient = async (patientId, user) => {
  // Patient can view only own vitals
  if (user?.role === "PATIENT" && user.patient_id !== patientId) {
    const err = new Error("Access denied");
    err.status = 403;
    throw err;
  }

  return {
    patient_id: patientId,
    vitals: await repo.getPatientVitals(patientId)
  };
};

exports.getMyVitals = async (user) => {
  if (user.role !== "PATIENT") {
    const err = new Error("Access denied");
    err.status = 403;
    throw err;
  }

  const patient = await repo.getPatientIdByUserId(user.user_id);
  if (!patient) {
    const err = new Error("Patient profile not found");
    err.status = 404;
    throw err;
  }

  return {
    patient_id: patient.patient_id,
    vitals: await repo.getPatientVitals(patient.patient_id)
  };
};
