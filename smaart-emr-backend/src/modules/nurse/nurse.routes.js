const express = require("express");
const router = express.Router();

const nurseController = require("./nurse.controller");
const authMiddleware = require("../../middlewares/auth.middleware");
const roleMiddleware = require("../../middlewares/role.middleware");
const ROLES = require("../../config/roles");

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

module.exports = router;
