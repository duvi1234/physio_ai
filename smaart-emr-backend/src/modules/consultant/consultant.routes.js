const router = require("express").Router();
const consultantController = require("./consultant.controller");
const auth = require("../../middlewares/auth.middleware");
const role = require("../../middlewares/role.middleware");
const ROLES = require("../../config/roles");

router.get(
  "/",
  auth,
  role(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  consultantController.listConsultants
);

router.post(
  "/",
  auth,
  role(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  consultantController.createConsultant
);

router.use(auth);
router.use(role(ROLES.CONSULTANT, ROLES.PHYSIO, ROLES.PHYSIOTHERAPIST));

router.get("/me", consultantController.getMyProfile);
router.get("/patients", consultantController.getMyPatients);
router.get("/patients/:patientId/vitals", consultantController.getPatientVitals);
router.post("/patients/:patientId/consultation", consultantController.addConsultationNote);
router.get("/appointments/pending", consultantController.getPendingAppointments);
router.patch("/appointments/:appointmentId/accept", consultantController.acceptAppointment);
router.patch("/appointments/:appointmentId/reject", consultantController.rejectAppointment);
router.get("/dashboard/stats", consultantController.getDashboardStats);

module.exports = router;
