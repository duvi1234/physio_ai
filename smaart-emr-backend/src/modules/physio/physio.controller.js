const physioService = require("./physio.service");
const { success, error } = require("../../utils/responseHandler");
const logAudit = require("../../utils/auditLogger");
const userService = require("../user/user.service");

exports.getDashboard = async (req, res) => {
  try {
    const data = await physioService.getDashboardStats(req.user);
    success(res, "Physio dashboard stats", data);
  } catch (err) {
    error(res, err.message, 500);
  }
};

exports.getAppointments = async (req, res) => {
  try {
    const rows = await physioService.listAppointments(req.user, req.query || {});
    success(res, "Physio appointments fetched", rows);
  } catch (err) {
    error(res, err.message, 400);
  }
};

exports.getPatientCase = async (req, res) => {
  try {
    const data = await physioService.getPatientCase(req.user, req.params.patientId);
    success(res, "Patient case retrieved", data);
  } catch (err) {
    error(res, err.message, 403);
  }
};

exports.createPostureAnalysis = async (req, res) => {
  try {
    const record = await physioService.createPostureAnalysis(req.user, req.body || {});
    await logAudit({
      userId: req.user._id,
      role: req.user.role,
      action: "CREATE",
      entityType: "PostureAnalysis",
      entityId: record._id
    });
    success(res, "Posture analysis saved", record, 201);
  } catch (err) {
    error(res, err.message, 400);
  }
};

exports.createTreatmentPlan = async (req, res) => {
  try {
    const record = await physioService.createTreatmentPlan(req.user, req.body || {});
    await logAudit({
      userId: req.user._id,
      role: req.user.role,
      action: "CREATE",
      entityType: "TreatmentPlan",
      entityId: record._id
    });
    success(res, "Treatment plan saved", record, 201);
  } catch (err) {
    error(res, err.message, 400);
  }
};

exports.createSessionNote = async (req, res) => {
  try {
    const record = await physioService.createSessionNote(req.user, req.body || {});
    await logAudit({
      userId: req.user._id,
      role: req.user.role,
      action: "CREATE",
      entityType: "SessionNote",
      entityId: record._id
    });
    success(res, "Session note saved", record, 201);
  } catch (err) {
    error(res, err.message, 400);
  }
};

exports.updateAppointmentStatus = async (req, res) => {
  try {
    const updated = await physioService.updateAppointmentStatus(req.user, req.params.appointmentId, req.body.status);
    await logAudit({
      userId: req.user._id,
      role: req.user.role,
      action: "UPDATE_STATUS",
      entityType: "Appointment",
      entityId: req.params.appointmentId
    });
    success(res, "Appointment status updated", updated);
  } catch (err) {
    error(res, err.message, 400);
  }
};

exports.getAnalytics = async (req, res) => {
  try {
    const data = await physioService.getAnalytics(req.user, req.params.patientId);
    success(res, "Physio analytics retrieved", data);
  } catch (err) {
    error(res, err.message, 400);
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await userService.getUserById(req.user._id);
    if (!user) return error(res, "Physio not found", 404);
    const payload = user.toObject ? user.toObject() : user;
    delete payload.password;
    success(res, "Profile retrieved", payload);
  } catch (err) {
    error(res, err.message, 400);
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, email } = req.body || {};
    const update = {};
    if (name !== undefined) update.name = name;
    if (phone !== undefined) update.phone = phone;
    if (email !== undefined) update.email = email;
    const updated = await userService.updateUser(req.user._id, update);
    await logAudit({
      userId: req.user._id,
      role: req.user.role,
      action: "UPDATE",
      entityType: "PhysioProfile",
      entityId: req.user._id
    });
    const payload = updated.toObject ? updated.toObject() : updated;
    delete payload.password;
    success(res, "Profile updated", payload);
  } catch (err) {
    error(res, err.message, 400);
  }
};
