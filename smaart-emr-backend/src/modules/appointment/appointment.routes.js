const express = require("express");
const router = express.Router();

const controller = require("./appointment.controller");
const auth = require("../../middlewares/auth.middleware");
const role = require("../../middlewares/role.middleware");
const ROLES = require("../../config/roles");

// Admin + Patient can create
router.post(
  "/",
  auth,
  role(ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.PATIENT),
  controller.createAppointment
);

router.get(
  "/",
  auth,
  role(ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.NURSE, ROLES.CONSULTANT, ROLES.PHYSIO, ROLES.PHYSIOTHERAPIST, ROLES.PATIENT),
  controller.getAppointments
);

// Get own appointments
router.get(
  "/my",
  auth,
  controller.getMyAppointments
);

// Admin only - update status
router.patch(
  "/:appointmentId/status",
  auth,
  role(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  controller.updateAppointmentStatus
);

module.exports = router;
