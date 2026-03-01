const express = require("express");
const router = express.Router();

const controller = require("./appointment.controller");
const auth = require("../../middlewares/auth.middleware");
const role = require("../../middlewares/role.middleware");
const roleFilter = require("../../middlewares/roleFilter.middleware");
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
  roleFilter,
  controller.getAppointments
);

router.get(
  "/today",
  auth,
  role(ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.NURSE, ROLES.CONSULTANT, ROLES.PHYSIO, ROLES.PHYSIOTHERAPIST),
  roleFilter,
  controller.getTodayAppointments
);

router.get(
  "/patient/:patientId",
  auth,
  role(ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.NURSE, ROLES.CONSULTANT, ROLES.PHYSIO, ROLES.PHYSIOTHERAPIST, ROLES.PATIENT),
  roleFilter,
  (req, res, next) => {
    req.query = { ...req.query, patientId: req.params.patientId };
    return controller.getAppointments(req, res, next);
  }
);

router.patch(
  "/status",
  auth,
  role(ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.NURSE),
  controller.updateAppointmentStatusByPayload
);

router.patch(
  "/checkin",
  auth,
  role(ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.NURSE),
  controller.checkInAppointment
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
