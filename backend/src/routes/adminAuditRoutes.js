"use strict";

const express = require("express");
const pool = require("../config/db");

const { authenticate } = require("../middleware/auth.middleware");
const { authorize } = require("../middleware/role.middleware");

const router = express.Router();

/* ======================================================
   ADMIN – FULL AUDIT LOGS
   GET /admin/audit-logs
   ====================================================== */
router.get(
  "/audit-logs",
  authenticate,
  authorize("ADMIN"),
  async (req, res) => {
    try {
      const { limit = 100, offset = 0 } = req.query;

      // 1. Get total count
      const countRes = await pool.query("SELECT COUNT(*) FROM audit_logs");
      const totalCount = parseInt(countRes.rows[0].count, 10);

      // 2. Fetch paginated logs
      const result = await pool.query(
        `
        SELECT
          audit_id,
          actor_user_id,
          action,
          entity_type,
          entity_id,
          ip_address,
          created_at
        FROM audit_logs
        ORDER BY created_at DESC
        LIMIT $1 OFFSET $2
        `,
        [limit, offset]
      );

      res.status(200).json({
        count: totalCount,
        logs: result.rows
      });
    } catch (err) {
      console.error("ADMIN GET AUDIT LOGS ERROR →", err);
      res.status(500).json({
        error: err.message   // keep during dev
      });
    }
  }
);

/* ======================================================
   ADMIN DASHBOARD – AUDIT LOG SUMMARY
   GET /admin/audit-logs/summary
   ====================================================== */
router.get(
  "/audit-logs/summary",
  authenticate,
  authorize("ADMIN"),
  async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT
          COUNT(*) AS total_events,
          COUNT(*) FILTER (WHERE action = 'LOGIN') AS logins,
          COUNT(*) FILTER (WHERE action = 'PERMISSION_DENIED') AS denied,
          COUNT(*) FILTER (WHERE entity_type = 'PATIENT') AS patient_access,
          COUNT(DISTINCT actor_user_id) AS unique_users
        FROM audit_logs
      `);

      res.status(200).json(result.rows[0]);
    } catch (err) {
      console.error("AUDIT SUMMARY ERROR →", err);
      res.status(500).json({
        error: "Dashboard summary failed"
      });
    }
  }
);

module.exports = router;
