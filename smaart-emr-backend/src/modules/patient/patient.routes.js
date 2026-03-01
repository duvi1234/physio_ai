const express = require("express");
const router = express.Router();

const patientController = require("./patient.controller");
const authMiddleware = require("../../middlewares/auth.middleware");
const roleMiddleware = require("../../middlewares/role.middleware");
const ROLES = require("../../config/roles");
const upload = require("../../storage/multer.config");

// Create new patient (Admin only)
router.post(
  "/",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  patientController.createPatient
);

router.get(
  "/",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.NURSE, ROLES.CONSULTANT, ROLES.PHYSIO, ROLES.PHYSIOTHERAPIST),
  patientController.listPatients
);

router.get(
  "/me",
  authMiddleware,
  roleMiddleware(ROLES.PATIENT),
  patientController.getMyProfile
);

router.get(
  "/appointments",
  authMiddleware,
  roleMiddleware(ROLES.PATIENT),
  patientController.getMyAppointments
);

router.put(
  "/me",
  authMiddleware,
  roleMiddleware(ROLES.PATIENT),
  patientController.updateMyProfile
);

router.post(
  "/me/photo",
  authMiddleware,
  roleMiddleware(ROLES.PATIENT),
  upload.single("file"),
  patientController.uploadMyProfilePhoto
);

// Search patient
router.get(
  "/search",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.NURSE, ROLES.CONSULTANT, ROLES.PHYSIO, ROLES.PHYSIOTHERAPIST),
  patientController.searchPatients
);

router.patch(
  "/medical-history",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.NURSE),
  patientController.updateMedicalHistory
);

router.get(
  "/:patientId/timeline",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.NURSE, ROLES.CONSULTANT, ROLES.PHYSIO, ROLES.PHYSIOTHERAPIST, ROLES.PATIENT),
  patientController.getPatientTimeline
);

// Get patient by ID
router.get(
  "/:patientId",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.NURSE, ROLES.CONSULTANT, ROLES.PHYSIO, ROLES.PHYSIOTHERAPIST),
  patientController.getPatient
);

// Update patient
router.put(
  "/:patientId",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  patientController.updatePatient
);

// Admin delete patient (soft delete)
router.delete(
  "/:patientId",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  patientController.deletePatient
);

// Admin reactivate patient
router.patch(
  "/:patientId/activate",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  patientController.activatePatient
);

module.exports = router;
