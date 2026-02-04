"use strict";

const pool = require("../../config/db");
const labsService = require("./labs.service");

/* ======================================================
   1️⃣ DOCTOR ORDERS LAB TEST
   ====================================================== */
exports.createLabOrder = async (patientId, testId, doctorId) => {
  const { rows } = await pool.query(
    `
    INSERT INTO lab_orders
      (patient_id, doctor_id, test_id, status, ordered_at)
    VALUES ($1, $2, $3, 'ORDERED', NOW())
    RETURNING *
    `,
    [patientId, doctorId, testId]
  );

  return rows[0];
};

/* ======================================================
   2️⃣ LAB TECH UPLOADS LAB REPORT
   ====================================================== */
exports.createLabReport = async (
  orderId,
  resultValues,
  labTechId,
  labPrivateKey
) => {
  return await labsService.createLabReport(
    orderId,
    resultValues,
    labTechId,
    labPrivateKey
  );
};

/* ======================================================
   3️⃣ DOCTOR VERIFIES LAB REPORT
   ====================================================== */
exports.verifyLabReport = async (
  reportId,
  doctorId,
  doctorPrivateKey
) => {
  return await labsService.verifyAndSignReport(
    reportId,
    doctorId,
    doctorPrivateKey
  );
};

/* ======================================================
   4️⃣ VIEW SINGLE LAB REPORT
   ====================================================== */
exports.viewLabReport = async (reportId, viewerUserId, viewerRole) => {
  return await labsService.viewLabReport(reportId, viewerUserId, viewerRole);
};

/* ======================================================
   5️⃣ PATIENT VIEWS OWN VERIFIED LAB REPORTS
   ====================================================== */
exports.getPatientLabReports = async (userId) => {
  // Resolve patient_id from user_id
  const patientRes = await pool.query(
    `SELECT patient_id FROM patients WHERE user_id = $1`,
    [userId]
  );

  if (patientRes.rowCount === 0) {
    throw new Error("Patient record not found");
  }

  const patientId = patientRes.rows[0].patient_id;

  const { rows } = await pool.query(
    `
    SELECT
      lr.report_id,
      lr.verified,
      lr.verified_at,
      lo.ordered_at,
      ltc.test_name
    FROM lab_reports lr
    JOIN lab_orders lo ON lo.order_id = lr.order_id
    JOIN lab_test_catalog ltc ON ltc.test_id = lo.test_id
    WHERE lo.patient_id = $1
      AND lr.verified = true
    ORDER BY lr.created_at DESC
    `,
    [patientId]
  );

  return rows;
};

/* ======================================================
   6️⃣ DOCTOR VIEWS ASSIGNED LAB REPORTS
   ====================================================== */
exports.getDoctorLabReports = async (doctorId) => {
  return await labsService.getDoctorLabReports(doctorId);
};
