const painService = require("./pain.service");
const { success, error } = require("../../utils/responseHandler");
const logAudit = require("../../utils/auditLogger");

exports.createPainEntry = async (req, res) => {
  try {
    const idempotencyKey = String(
      req.headers["x-idempotency-key"] || req.body?.idempotencyKey || ""
    ).trim();
    const row = await painService.createPainEntry(req.body || {}, req.user, { idempotencyKey });
    await logAudit({
      userId: req.user._id,
      role: req.user.role,
      action: "CREATE",
      entityType: "PainAssessment3D",
      entityId: row._id,
      metadata: {
        patientId: row.patientId,
        entryCount: Array.isArray(row.painEntries) ? row.painEntries.length : 0
      }
    });
    return success(res, "Pain entry saved successfully", row, 201);
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

exports.getPainEntries = async (req, res) => {
  try {
    const rows = await painService.getPainEntries(req.params.patientId, req.query || {}, req.user);
    return success(res, "Pain entries fetched successfully", rows);
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

exports.getPainTimeline = async (req, res) => {
  try {
    const data = await painService.getPainTimeline(req.params.patientId, req.query || {}, req.user);
    return success(res, "Pain timeline fetched successfully", data);
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

exports.getPainReport = async (req, res) => {
  try {
    const data = await painService.getPainReport(req.params.patientId, req.query || {}, req.user);
    return success(res, "Pain report fetched successfully", data);
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};
