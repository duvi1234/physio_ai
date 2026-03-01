const express = require("express");
const router = express.Router();

const nurseController = require("./nurse.controller");
const authMiddleware = require("../../middlewares/auth.middleware");
const roleMiddleware = require("../../middlewares/role.middleware");
const ROLES = require("../../config/roles");

router.get(
  "/dashboard",
  authMiddleware,
  roleMiddleware(ROLES.NURSE),
  nurseController.getDashboardStats
);

router.get(
  "/appointments",
  authMiddleware,
  roleMiddleware(ROLES.NURSE),
  nurseController.getAssignedAppointments
);

router.patch(
  "/appointments/:appointmentId/status",
  authMiddleware,
  roleMiddleware(ROLES.NURSE),
  nurseController.updateAssignedAppointmentStatus
);

router.get(
  "/patients",
  authMiddleware,
  roleMiddleware(ROLES.NURSE),
  nurseController.getAssignedPatients
);

router.get(
  "/assigned-patients",
  authMiddleware,
  roleMiddleware(ROLES.NURSE),
  nurseController.getAssignedPatientSummary
);

router.put(
  "/profile",
  authMiddleware,
  roleMiddleware(ROLES.NURSE),
  nurseController.updateMyProfile
);

// Nurse records vitals
router.post(
  "/vitals",
  authMiddleware,
  roleMiddleware(ROLES.NURSE),
  nurseController.recordVitals
);

router.get(
  "/vitals",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.CONSULTANT, ROLES.PHYSIO, ROLES.PHYSIOTHERAPIST, ROLES.NURSE, ROLES.PATIENT),
  nurseController.listVitals
);

// Admin + Physio can view vitals
router.get(
  "/vitals/:patientId",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.CONSULTANT, ROLES.PHYSIO, ROLES.PHYSIOTHERAPIST, ROLES.NURSE, ROLES.PATIENT),
  nurseController.getPatientVitals
);

router.put(
  "/vitals/:vitalsId",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.NURSE),
  nurseController.updateVitals
);

router.delete(
  "/vitals/:vitalsId",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.NURSE),
  nurseController.deleteVitals
);

// Pain Assessments
router.post(
  "/assessments",
  authMiddleware,
  roleMiddleware(ROLES.NURSE),
  nurseController.createPainAssessment
);

router.get(
  "/assessments",
  authMiddleware,
  roleMiddleware(ROLES.NURSE),
  nurseController.listPainAssessments
);

router.put(
  "/assessments/:assessmentId",
  authMiddleware,
  roleMiddleware(ROLES.NURSE),
  nurseController.updatePainAssessment
);

router.delete(
  "/assessments/:assessmentId",
  authMiddleware,
  roleMiddleware(ROLES.NURSE),
  nurseController.deletePainAssessment
);

// Nurse Notes
router.post(
  "/notes",
  authMiddleware,
  roleMiddleware(ROLES.NURSE),
  nurseController.createNurseNote
);

router.get(
  "/notes",
  authMiddleware,
  roleMiddleware(ROLES.NURSE),
  nurseController.listNurseNotes
);

router.put(
  "/notes/:noteId",
  authMiddleware,
  roleMiddleware(ROLES.NURSE),
  nurseController.updateNurseNote
);

router.delete(
  "/notes/:noteId",
  authMiddleware,
  roleMiddleware(ROLES.NURSE),
  nurseController.deleteNurseNote
);

module.exports = router;
