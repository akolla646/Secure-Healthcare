<<<<<<< HEAD
/**
 * Express Application Configuration
 * 
 * This is the main application setup file that configures Express with all
 * necessary middleware, routes, and modules. It serves as the central hub
 * connecting all parts of the Secure Healthcare backend.
 * 
 * Architecture:
 * - Uses modular route structure organized by domain (auth, patients, labs, etc.)
 * - Implements CORS for cross-origin requests from frontend
 * - Provides health check endpoint for monitoring
 * 
 * @module app
 */

// =============================================================================
// IMPORTS
// =============================================================================

// Core Express framework
const express = require("express");

// CORS middleware for handling cross-origin requests from frontend
const cors = require("cors");

// Load environment variables from .env file (Robust path resolution)
const path = require("path");
const dotenvResult = require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
if (dotenvResult.error) {
    console.error("❌ DOTENV ERROR:", dotenvResult.error);
} else {
    console.log("✅ DOTENV loaded. Keys:", Object.keys(dotenvResult.parsed || {}).join(", "));
}
console.log("Checking keys: LAB_PRIVATE_KEY is " + (process.env.LAB_PRIVATE_KEY ? "PRESENT" : "MISSING"));

// =============================================================================
// APPLICATION INITIALIZATION
// =============================================================================

// Create the Express application instance
const app = express();

// Initialize database connection (side effect - establishes connection pool)
require("./config/db");

// =============================================================================
// GLOBAL MIDDLEWARE
// =============================================================================

// Enable CORS for all routes - allows frontend to make API requests
app.use(cors());

// Parse incoming JSON request bodies
app.use(express.json());

// =============================================================================
// ROUTE IMPORTS
// =============================================================================

// Authentication routes - login, register, password reset, MFA
const authRoutes = require("./modules/auth/auth.routes");

// Patient management routes - CRUD operations for patient records
const patientRoutes = require("./modules/patients/patient.routes");

// Appointment booking and management routes
const appointmentsRoutes = require("./modules/appointments/appointments.routes");

// Vital signs recording and retrieval routes
const vitalsRoutes = require("./modules/vitals/vitals.routes");

// Prescription management routes
const prescriptionsRoutes = require("./modules/prescriptions/prescriptions.routes");

// Admin audit log viewing routes
const adminAuditRoutes = require("./routes/adminAuditRoutes");

// Lab orders and reports routes - ordering, uploading, verification
const labRoutes = require("./modules/labs/labs.routes");

// CDSS routes - lab report parsing and care plan generation
const cdssRoutes = require("./modules/cdss/cdss.routes");

// Admin user management routes - create, view, delete users
const adminUsersRoutes = require("./routes/adminUsers.routes");

// =============================================================================
// ROUTE REGISTRATION
// =============================================================================

// Admin routes - user management and audit logs
app.use("/admin", adminUsersRoutes);  // POST/GET/DELETE /admin/users
app.use("/admin", adminAuditRoutes);  // GET /admin/audit-logs

// Domain-specific routes
app.use("/cdss", cdssRoutes);                   // CDSS parser and generator
app.use("/labs", labRoutes);                    // Lab orders and reports
app.use("/prescriptions", prescriptionsRoutes); // Medication prescriptions
app.use("/vitals", vitalsRoutes);              // Patient vital signs
app.use("/auth", authRoutes);                  // Authentication & authorization
app.use("/patients", patientRoutes);           // Patient records
app.use("/appointments", appointmentsRoutes);  // Appointment scheduling
app.use("/doctors", require("./modules/doctors/doctors.routes")); // Doctor listing

// =============================================================================
// UTILITY ROUTES
// =============================================================================

/**
 * Health Check Endpoint
 * 
 * GET /health
 * 
 * Used by monitoring tools and load balancers to verify the server is running.
 * Returns a simple JSON response with status information.
 */
app.get("/health", (req, res) => {
    res.status(200).json({
        status: "OK",
        message: "Backend running"
    });
});

// =============================================================================
// ERROR HANDLING
// =============================================================================

/**
 * Global Error Handler
 * 
 * Catches all unhandled errors from routes and middleware.
 * Returns a consistent JSON response instead of HTML.
 */
app.use((err, req, res, next) => {
    console.error("❌ UNHANDLED ERROR:", {
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method
    });

    res.status(err.status || 500).json({
        success: false,
        error: err.message || "Internal Server Error"
    });
});

// Export the configured Express app for use in server.js
=======
const express = require('express');
const cors = require('cors');
const path = require('path');

// Import routes
const authRoutes = require('./modules/auth/auth.routes');
const patientRoutes = require('./modules/patients/patient.routes');
const doctorRoutes = require('./modules/doctors/doctors.routes');
const appointmentRoutes = require('./modules/appointments/appointments.routes');
const prescriptionRoutes = require('./modules/prescriptions/prescriptions.routes');
const labRoutes = require('./modules/labs/labs.routes');
const vitalsRoutes = require('./modules/vitals/vitals.routes');
const cdssRoutes = require('./modules/cdss/cdss.routes');
const adminUsersRoutes = require('./routes/adminUsers.routes');
const adminAuditRoutes = require('./routes/adminAuditRoutes');
const paymentRoutes = require('./modules/payments/payment.routes');

const app = express();

// Middleware
app.use(cors());

// Webhook route must be parsed as raw JSON, so we define it BEFORE the general json middleware
// OR we can rely on route-specific parsing if defined in payment.routes.js
// But usually extensive middleware like express.json() consumes the stream.
// To satisfy Stripe signature verification, we often use a custom verify function in express.json
// or route specific middleware. The route file uses express.raw() which is good.
// However, global express.json() might interfere if it runs first on the same path.
// Let's keep global middleware but ensure webhook route is handled correctly.
// Since we mount routes later, global middleware runs first.
// We need to exclude /api/payments/webhook from global express.json if possible,
// or use a valid approach.
// Easier approach: Use a middleware that restricts JSON parsing to non-webhook routes.

app.use((req, res, next) => {
    if (req.originalUrl === '/api/payments/webhook') {
        next();
    } else {
        express.json()(req, res, next);
    }
});
app.use(express.urlencoded({ extended: true }));

// Serve static files if needed
// app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/labs', labRoutes);
app.use('/api/vitals', vitalsRoutes);
app.use('/api/cdss', cdssRoutes);
app.use('/api/admin/users', adminUsersRoutes);
app.use('/api/admin/audit-logs', adminAuditRoutes);
app.use('/api/payments', paymentRoutes);

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Backend is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!', details: err.message });
});

>>>>>>> 946053a (feat: integrate Stripe payment and payment status tracking)
module.exports = app;
