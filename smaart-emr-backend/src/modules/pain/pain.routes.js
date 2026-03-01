const router = require("express").Router();
const painController = require("./pain.controller");
const { validatePainCreatePayload } = require("./pain.validation");
const auth = require("../../middlewares/auth.middleware");
const role = require("../../middlewares/role.middleware");
const ROLES = require("../../config/roles");

router.use(auth);
router.use(
  role(
    ROLES.ADMIN,
    ROLES.SUPER_ADMIN,
    ROLES.CONSULTANT,
    ROLES.PHYSIO,
    ROLES.PHYSIOTHERAPIST,
    ROLES.NURSE,
    ROLES.PATIENT
  )
);

router.post("/", validatePainCreatePayload, painController.createPainEntry);
router.get("/:patientId", painController.getPainEntries);
router.get("/:patientId/timeline", painController.getPainTimeline);
router.get("/:patientId/report", painController.getPainReport);

module.exports = router;
