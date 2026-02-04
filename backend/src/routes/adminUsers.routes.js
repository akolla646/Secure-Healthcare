"use strict";

const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const pool = require("../config/db");
const { encrypt } = require("../utils/encryption");

const { authenticate } = require("../middleware/auth.middleware");
const { authorize } = require("../middleware/role.middleware");

/* ======================================================
   ADMIN – CREATE USER
   POST /admin/users
   Roles: ADMIN, DOCTOR, LAB_TECH, PATIENT
   ====================================================== */
router.post(
  "/users",
  authenticate,
  authorize("ADMIN"),
  async (req, res) => {
    const client = await pool.connect();

    try {
      const {
        username,
        password,
        role,
        full_name,
        dob,
        gender,
        blood_group
      } = req.body;

      // 🔴 Base validation
      if (!username || !password || !role) {
        return res.status(400).json({
          error: "username, password and role are required"
        });
      }

      const normalizedUsername = username.trim().toLowerCase();
      const normalizedRole = role.trim().toUpperCase();

      // 🔴 Patient-specific validation
      if (normalizedRole === "PATIENT") {
        if (!full_name || !dob || !gender || !blood_group) {
          return res.status(400).json({
            error:
              "full_name, dob, gender, blood_group are required for patient"
          });
        }
      }

      await client.query("BEGIN");

      // 1️⃣ Check if user already exists
      const existingUser = await client.query(
        "SELECT user_id FROM users WHERE username = $1",
        [normalizedUsername]
      );

      if (existingUser.rowCount > 0) {
        await client.query("ROLLBACK");
        return res.status(409).json({
          error: "Username already exists"
        });
      }

      // 2️⃣ Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // 3️⃣ Create user (auth table)
      const userResult = await client.query(
        `
        INSERT INTO users (
          username,
          password_hash,
          is_active,
          is_locked,
          created_at
        )
        VALUES ($1, $2, TRUE, FALSE, NOW())
        RETURNING user_id
        `,
        [normalizedUsername, passwordHash]
      );

      const userId = userResult.rows[0].user_id;

      // 4️⃣ Resolve role
      const roleResult = await client.query(
        "SELECT role_id FROM roles WHERE role_name = $1",
        [normalizedRole]
      );

      if (roleResult.rowCount === 0) {
        throw new Error("Invalid role");
      }

      const roleId = roleResult.rows[0].role_id;

      // 5️⃣ Assign role
      await client.query(
        `
        INSERT INTO user_roles (user_id, role_id)
        VALUES ($1, $2)
        `,
        [userId, roleId]
      );

      // 6️⃣ Create patient domain record (if PATIENT)
      if (normalizedRole === "PATIENT") {
        await client.query(
          `
          INSERT INTO patients (
            user_id,
            full_name_encrypted,
            dob,
            gender,
            blood_group,
            medical_record_number,
            created_at
          )
          VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            'MRN-' || FLOOR(RANDOM() * 1000000),
            NOW()
          )
          `,
          [
            userId,
            encrypt(full_name),
            dob,
            gender,
            blood_group
          ]
        );
      }

      // 7️⃣ Audit log
      await client.query(
        `
        INSERT INTO audit_logs (
          actor_user_id,
          action,
          entity_type,
          entity_id
        )
        VALUES ($1, 'USER_CREATED', 'USER', $2)
        `,
        [req.user.user_id || req.user.id, userId]
      );

      await client.query("COMMIT");

      return res.status(201).json({
        message: "User created successfully",
        user_id: userId,
        role: normalizedRole
      });
    } catch (err) {
      await client.query("ROLLBACK");
      console.error("ADMIN CREATE USER ERROR →", err);
      return res.status(500).json({
        error: err.message
      });
    } finally {
      client.release();
    }
  }
);

/* ======================================================
   ADMIN – VIEW ALL USERS
   GET /admin/users
   ====================================================== */
router.get(
  "/users",
  authenticate,
  authorize("ADMIN"),
  async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT
          u.user_id,
          u.username,
          u.is_active,
          u.created_at,
          r.role_name
        FROM users u
        JOIN user_roles ur ON u.user_id = ur.user_id
        JOIN roles r ON ur.role_id = r.role_id
        ORDER BY u.created_at DESC
      `);

      res.status(200).json(result.rows);
    } catch (err) {
      console.error("ADMIN GET USERS ERROR →", err);
      res.status(500).json({
        error: "Failed to fetch users"
      });
    }
  }
);

module.exports = router;
