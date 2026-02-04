const patientService = require("./patient.service");
const { decrypt } = require("../../utils/crypto.util");
const logAudit = require("../../utils/auditLogger");

/**
 * CREATE patient (WITHOUT user account)
 */
async function createPatient(req, res) {
  try {
    const patient = await patientService.createPatient(req.body);

    // 🔐 AUDIT LOG (after successful creation)
    await logAudit({
      actorUserId: req.user.user_id,
      action: "CREATE_PATIENT",
      entityType: "PATIENT",
      entityId: patient.patient_id,
      ipAddress: req.ip
    });

    // 🔐 Decrypt before sending response
    if (patient.full_name_encrypted) {
      patient.full_name_encrypted = decrypt(patient.full_name_encrypted);
    }

    res.status(201).json(patient);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

/**
 * GET all patients
 */
async function getAll(req, res) {
  try {
    const patients = await patientService.getAllPatients();

    // 🔐 AUDIT LOG (bulk read)
    await logAudit({
      actorUserId: req.user.user_id,
      action: "VIEW_PATIENT",
      entityType: "PATIENT",
      entityId: null, // multiple patients
      ipAddress: req.ip
    });

    // 🔐 Decrypt ONLY for authorized roles
    if (["ADMIN", "DOCTOR", "NURSE"].includes(req.user.role)) {
      patients.forEach(p => {
        if (p.full_name_encrypted) {
          p.full_name_encrypted = decrypt(p.full_name_encrypted);
        }
      });
    }

    res.status(200).json(patients);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * REGISTER patient WITH user account
 */
async function registerPatientWithUser(req, res) {
  try {
    const patient = await patientService.registerPatientWithUser(req.body);

    // 🔐 AUDIT LOG (linking user account)
    await logAudit({
      actorUserId: req.user.user_id,
      action: "UPDATE_PATIENT",
      entityType: "PATIENT",
      entityId: patient.patient_id,
      ipAddress: req.ip
    });

    // 🔐 Decrypt before response
    if (patient.full_name_encrypted) {
      patient.full_name_encrypted = decrypt(patient.full_name_encrypted);
    }

    res.status(201).json(patient);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

module.exports = {
  createPatient,
  getAll,
  registerPatientWithUser
};
