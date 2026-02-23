require("dotenv").config();

const express = require("express");
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
const notificationRoutes = require("./modules/notification/notification.routes");

const tokenCleanupJob = require("./jobs/tokenCleanup.job");
const appointmentReminderJob = require("./jobs/appointmentReminder.job");

const app = express();

connectDB();

app.use(helmet);
app.use(corsConfig);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(rateLimiter);
app.use(logger);
app.use("/uploads", express.static("uploads"));

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "SMAART EMR API is running",
    data: { timestamp: new Date() }
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/user", userRoutes);
app.use("/api/consultant", consultantRoutes);
app.use("/api/consultants", consultantRoutes);
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
