const express = require("express");
const router = express.Router();
const adminController = require("./admin.controller");
const authMiddleware = require("../../middlewares/auth.middleware");
const roleMiddleware = require("../../middlewares/role.middleware");
const ROLES = require("../../config/roles");

// Protect all admin routes
router.use(authMiddleware);
router.use(roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN));

// ===== PATIENT ENDPOINTS =====
router.get("/patients", adminController.getPatients);
router.post("/patients", adminController.createPatient);
router.get("/patients/:patientId", adminController.getPatientDetail);
router.put("/patients/:patientId", adminController.updatePatient);
router.delete("/patients/:patientId", adminController.deletePatient);
router.patch("/patients/:patientId/activate", adminController.activatePatient);
router.get("/patients/:patientId/timeline", adminController.getPatientTimeline);

// ===== APPOINTMENT ENDPOINTS =====
router.get("/appointments", adminController.getAppointments);
router.post("/appointments", adminController.createAppointment);
router.get("/appointments/:appointmentId", adminController.getAppointmentDetail);
router.put("/appointments/:appointmentId", adminController.updateAppointment);
router.patch("/appointments/:appointmentId/status", adminController.updateAppointmentStatus);
router.patch("/appointments/:appointmentId/reassign", adminController.reassignAppointment);
router.delete("/appointments/:appointmentId", adminController.deleteAppointment);
router.patch("/appointments/:appointmentId/activate", adminController.activateAppointment);

// ===== NURSE ENDPOINTS =====
router.get("/nurses", adminController.getNurses);
router.post("/nurses", adminController.createNurse);
router.get("/nurses/:nurseId", adminController.getNurseDetail);
router.put("/nurses/:nurseId", adminController.updateNurse);
router.delete("/nurses/:nurseId", adminController.deleteNurse);
router.patch("/nurses/:nurseId/activate", adminController.activateNurse);
router.patch("/nurses/:nurseId/reset-password", adminController.resetNursePassword);

// ===== PHYSIOTHERAPIST ENDPOINTS =====
router.get("/physios", adminController.getPhysios);
router.post("/physios", adminController.createPhysio);
router.get("/physios/:physioId", adminController.getPhysioDetail);
router.put("/physios/:physioId", adminController.updatePhysio);
router.delete("/physios/:physioId", adminController.deletePhysio);
router.patch("/physios/:physioId/activate", adminController.activatePhysio);
router.patch("/physios/:physioId/reset-password", adminController.resetPhysioPassword);

// ===== REQUEST ENDPOINTS =====
router.get("/requests", adminController.getAppointmentRequests);
router.get("/requests/:requestId", adminController.getRequestDetail);
router.put("/requests/:requestId", adminController.updateRequest);
router.patch("/requests/:requestId/approve", adminController.approveRequest);
router.patch("/requests/:requestId/reject", adminController.rejectRequest);
router.delete("/requests/:requestId", adminController.deleteRequest);
router.patch("/requests/:requestId/activate", adminController.activateRequest);

// ===== DASHBOARD ENDPOINTS =====
router.get("/dashboard/stats", adminController.getDashboardStats);
router.get("/dashboard/activity-log", adminController.getActivityLog);

// ===== REPORTS ENDPOINTS =====
router.get("/reports/patients-growth", adminController.getPatientGrowth);
router.get("/reports/appointments-trends", adminController.getAppointmentsTrends);
router.get("/reports/physio-workload", adminController.getPhysioWorkload);
router.get("/reports/pain-areas", adminController.getPainAreas);
router.get("/reports/treatment-completion", adminController.getTreatmentCompletion);

// ===== SETTINGS ENDPOINTS =====
router.get("/settings", adminController.getSettings);
router.put("/settings", adminController.updateSettings);
router.patch("/settings/roles", adminController.updateRolePermissions);

module.exports = router;
