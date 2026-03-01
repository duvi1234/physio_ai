const express = require("express");
const router = express.Router();

const controller = require("./medicalRecord.controller");
const authMiddleware = require("../../middlewares/auth.middleware");
const roleMiddleware = require("../../middlewares/role.middleware");
const upload = require("../../storage/multer.config");
const ROLES = require("../../config/roles");

router.post(
  "/",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  upload.single("file"),
  controller.createRecord
);

router.post(
  "/upload",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.PATIENT, ROLES.NURSE, ROLES.CONSULTANT, ROLES.PHYSIO, ROLES.PHYSIOTHERAPIST),
  upload.single("file"),
  controller.createRecord
);

router.get(
  "/",
  authMiddleware,
  roleMiddleware(
    ROLES.ADMIN,
    ROLES.SUPER_ADMIN,
    ROLES.NURSE,
    ROLES.CONSULTANT,
    ROLES.PHYSIO,
    ROLES.PHYSIOTHERAPIST,
    ROLES.PATIENT
  ),
  controller.getRecordsByQuery
);

router.get(
  "/patient/:patientId",
  authMiddleware,
  roleMiddleware(
    ROLES.ADMIN,
    ROLES.SUPER_ADMIN,
    ROLES.NURSE,
    ROLES.CONSULTANT,
    ROLES.PHYSIO,
    ROLES.PHYSIOTHERAPIST,
    ROLES.PATIENT
  ),
  controller.getPatientRecords
);

router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.NURSE),
  controller.deleteRecord
);

module.exports = router;
