const express = require("express");
const router = express.Router();

const requestController = require("./request.controller");
const authMiddleware = require("../../middlewares/auth.middleware");
const roleMiddleware = require("../../middlewares/role.middleware");
const ROLES = require("../../config/roles");

// Public route (Website)
router.post("/", requestController.createRequest);

// Admin Dashboard View
router.get(
  "/",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  requestController.getAllRequests
);

// Admin updates status
router.patch(
  "/:requestId",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  requestController.updateStatus
);

router.post(
  "/:requestId/convert",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  requestController.convertToPatientAppointment
);

module.exports = router;
