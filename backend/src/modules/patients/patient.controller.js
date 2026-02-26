/**
 * Patient Controller
 * Handles patient management and PII decryption.
 */

const patientService = require("./patient.service");
const { decrypt } = require("../../utils/crypto.util");
const logAudit = require("../../utils/auditLogger");

// ============================
// PATIENT CREATION
// ============================

// Create patient without user account (legacy/manual)
async function createPatient(req, res) {
  try {
    const patient = await patientService.createPatient(req.body);

    await logAudit({
      actorUserId: req.user.user_id,
      action: "CREATE_PATIENT",
      entityType: "PATIENT",
      entityId: patient.patient_id,
      ipAddress: req.ip
    });

    // Decrypt name for response
    if (patient.full_name_encrypted) {
      patient.full_name_encrypted = decrypt(patient.full_name_encrypted);
    }

    res.status(201).json(patient);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// ============================
// PATIENT LISTING
// ============================

// Get all patients (decrypts for medical staff)
async function getAll(req, res) {
  try {
    const patients = await patientService.getAllPatients();

    await logAudit({
      actorUserId: req.user.user_id,
      action: "VIEW_PATIENT",
      entityType: "PATIENT",
      entityId: null,
      ipAddress: req.ip
    });

    // Decrypt PII for authorized roles
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

// ============================
// REGISTRATION
// ============================

// Register patient with user account (portal access)
async function registerPatientWithUser(req, res) {
  try {
    const patient = await patientService.registerPatientWithUser(req.body);

    await logAudit({
      actorUserId: req.user.user_id,
      action: "UPDATE_PATIENT",
      entityType: "PATIENT",
      entityId: patient.patient_id,
      ipAddress: req.ip
    });

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
