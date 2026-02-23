const express = require("express");
const router = express.Router();

const controller = require("./notification.controller");
const authMiddleware = require("../../middlewares/auth.middleware");
const roleMiddleware = require("../../middlewares/role.middleware");
const ROLES = require("../../config/roles");

router.post(
  "/",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  controller.sendCustom
);

module.exports = router;
