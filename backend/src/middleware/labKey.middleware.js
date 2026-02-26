/**
 * Lab & Doctor Private Key Middleware
 * Attaches role-based private keys from environment variables.
 */

"use strict";

/**
 * Attach Lab Technician Private Key
 */
module.exports.attachLabPrivateKey = (req, res, next) => {
  // Only for LAB_TECH role
  if (req.user.role !== "LAB_TECH") return next();

  // Ensure key exists
  if (!process.env.LAB_PRIVATE_KEY) {
    return res.status(500).json({ error: "Lab private key not configured" });
  }

  // Format PEM key (fix escaped newlines, remove wrapping quotes)
  let key = process.env.LAB_PRIVATE_KEY.trim();
  if (key.startsWith('"') && key.endsWith('"')) {
    key = key.substring(1, key.length - 1);
  }

  req.labPrivateKey = key.replace(/\\n/g, '\n');
  next();
};

/**
 * Attach Doctor Private Key
 */
module.exports.attachDoctorPrivateKey = (req, res, next) => {
  // Only for DOCTOR role
  if (req.user.role !== "DOCTOR") return next();

  // Ensure key exists
  if (!process.env.DOCTOR_PRIVATE_KEY) {
    return res.status(500).json({ error: "Doctor private key not configured" });
  }

  // Format PEM key
  let key = process.env.DOCTOR_PRIVATE_KEY.trim();
  if (key.startsWith('"') && key.endsWith('"')) {
    key = key.substring(1, key.length - 1);
  }

  req.doctorPrivateKey = key.replace(/\\n/g, '\n');
  next();
};
