"use strict";

module.exports.attachLabPrivateKey = (req, res, next) => {
  if (req.user.role !== "LAB_TECH") {
    return next();
  }

  if (!process.env.LAB_PRIVATE_KEY) {
    return res.status(500).json({
      error: "Lab private key not configured"
    });
  }

  req.labPrivateKey = process.env.LAB_PRIVATE_KEY.replace(/\\n/g, '\n');
  next();
};

module.exports.attachDoctorPrivateKey = (req, res, next) => {
  if (req.user.role !== "DOCTOR") {
    return next();
  }

  if (!process.env.DOCTOR_PRIVATE_KEY) {
    return res.status(500).json({
      error: "Doctor private key not configured"
    });
  }

  req.doctorPrivateKey = process.env.DOCTOR_PRIVATE_KEY.replace(/\\n/g, '\n');
  next();
};
