const router = require("express").Router();
const controller = require("./physio.controller");
const auth = require("../../middlewares/auth.middleware");
const role = require("../../middlewares/role.middleware");
const ROLES = require("../../config/roles");

router.use(auth);
router.use(role(ROLES.CONSULTANT, ROLES.PHYSIO, ROLES.PHYSIOTHERAPIST));

router.get("/dashboard", controller.getDashboard);
router.get("/appointments", controller.getAppointments);
router.patch("/appointments/:appointmentId/status", controller.updateAppointmentStatus);
router.get("/patient/:patientId", controller.getPatientCase);
router.post("/posture-analysis", controller.createPostureAnalysis);
router.post("/treatment-plan", controller.createTreatmentPlan);
router.post("/session-notes", controller.createSessionNote);
router.get("/analytics/:patientId", controller.getAnalytics);
router.get("/profile", controller.getProfile);
router.put("/profile", controller.updateProfile);

module.exports = router;
