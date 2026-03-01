const router = require("express").Router();
const controller = require("./alert.controller");
const auth = require("../../middlewares/auth.middleware");
const role = require("../../middlewares/role.middleware");
const ROLES = require("../../config/roles");

router.post(
  "/",
  auth,
  role(ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.NURSE),
  controller.createAlert
);

router.get(
  "/today",
  auth,
  role(ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.NURSE, ROLES.CONSULTANT, ROLES.PHYSIO, ROLES.PHYSIOTHERAPIST, ROLES.PATIENT),
  controller.getTodayAlerts
);

module.exports = router;
