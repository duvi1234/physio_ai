const express = require("express");
const router = express.Router();
const userController = require("./user.controller");
const authMiddleware = require("../../middlewares/auth.middleware");
const roleMiddleware = require("../../middlewares/role.middleware");
const ROLES = require("../../config/roles");

router.get(
  "/",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  userController.listUsers
);

router.post(
  "/",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  userController.createUser
);

router.post(
  "/create-nurse",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  userController.createNurse
);

router.post(
  "/create-physio",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  userController.createPhysio
);

router.get(
  "/staff",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  userController.listStaff
);

router.get(
  "/staff-attendance",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  userController.getStaffAttendanceToday
);

module.exports = router;
