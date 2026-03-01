require("dotenv").config();

const express = require("express");
const path = require("path");
const helmet = require("./config/helmet");
const corsConfig = require("./config/cors");
const connectDB = require("./config/database");
const rateLimiter = require("./middlewares/rateLimiter");
const errorHandler = require("./middlewares/error.middleware");
const logger = require("./config/logger");

const authRoutes = require("./modules/auth/auth.routes");
const userRoutes = require("./modules/user/user.routes");
const patientRoutes = require("./modules/patient/patient.routes");
const appointmentRoutes = require("./modules/appointment/appointment.routes");
const appointmentRequestRoutes = require("./modules/appointmentRequest/request.routes");
const nurseRoutes = require("./modules/nurse/nurse.routes");
const medicalRecordRoutes = require("./modules/medicalRecords/medicalRecord.routes");
const consultantRoutes = require("./modules/consultant/consultant.routes");
const physioRoutes = require("./modules/physio/physio.routes");
const notificationRoutes = require("./modules/notification/notification.routes");
const alertRoutes = require("./modules/alerts/alert.routes");
const painRoutes = require("./modules/pain/pain.routes");
const adminRoutes = require("./modules/admin/admin.routes");

const tokenCleanupJob = require("./jobs/tokenCleanup.job");
const appointmentReminderJob = require("./jobs/appointmentReminder.job");
const exampleRoutes = require("./routes/example.routes");
const seedDatabase = require("./utils/seedDatabase");

const app = express();

connectDB();

// Seed database if needed
if (process.env.NODE_ENV !== "production") {
  seedDatabase().catch(err => console.error("Seeding error:", err.message));
}

app.use(helmet);
app.use(corsConfig);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(rateLimiter);
app.use(logger);
app.use(
  "/uploads",
  (req, res, next) => {
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    res.setHeader("Cross-Origin-Embedder-Policy", "unsafe-none");
    res.setHeader("Access-Control-Allow-Origin", "*");
    next();
  },
  express.static(path.join(__dirname, "../uploads"))
);

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "SMAART EMR API is running",
    data: { timestamp: new Date() }
  });
});

// Example public routes (no auth) - useful to verify frontend->backend connectivity quickly
app.use("/api/example", exampleRoutes);

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/user", userRoutes);
app.use("/api/consultant", consultantRoutes);
app.use("/api/consultants", consultantRoutes);
app.use("/api/physio", physioRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/patient", patientRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/appointment", appointmentRoutes);
app.use("/api/appointment-requests", appointmentRequestRoutes);
app.use("/api/appointmentRequest", appointmentRequestRoutes);
app.use("/api/requests", appointmentRequestRoutes);
app.use("/api/nurse", nurseRoutes);
app.use("/api/medical-records", medicalRecordRoutes);
app.use("/api/medicalRecords", medicalRecordRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/notification", notificationRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/alert", alertRoutes);
app.use("/api/pain", painRoutes);
app.use("/api/admin", adminRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found",
    data: null
  });
});

app.use(errorHandler);

tokenCleanupJob.start();
appointmentReminderJob.start();

module.exports = app;
