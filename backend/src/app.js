const express = require("express");
const cors = require("cors");
require("dotenv").config();

// Initialize app
const app = express();

// DB connection
require("./config/db");

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require("./modules/auth/auth.routes");
const patientRoutes = require("./modules/patients/patient.routes");
const appointmentsRoutes = require("./modules/appointments/appointments.routes");
const vitalsRoutes = require("./modules/vitals/vitals.routes");
const prescriptionsRoutes = require("./modules/prescriptions/prescriptions.routes");
const adminAuditRoutes = require("./routes/adminAuditRoutes");
const labRoutes = require("./modules/labs/labs.routes");
const adminUsersRoutes = require("./routes/adminUsers.routes");

app.use("/admin", adminUsersRoutes);
app.use("/labs", labRoutes);
app.use("/admin", adminAuditRoutes);
app.use("/prescriptions", prescriptionsRoutes);
app.use("/vitals", vitalsRoutes);
app.use("/auth", authRoutes);
app.use("/patients", patientRoutes);
app.use("/appointments", appointmentsRoutes);
app.use("/doctors", require("./modules/doctors/doctors.routes"));

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Backend running"
  });
});

// 🔑 EXPORT APP
module.exports = app;
