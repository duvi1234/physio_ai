const alertService = require("./alert.service");
const { success, error } = require("../../utils/responseHandler");

exports.createAlert = async (req, res) => {
  try {
    const row = await alertService.createAlert(req.body || {}, req.user);
    return success(res, "Alert created", row, 201);
  } catch (err) {
    return error(res, err.message, err.status || 400);
  }
};

exports.getTodayAlerts = async (req, res) => {
  try {
    const rows = await alertService.listTodayAlerts(req.query || {}, req.user);
    return success(res, "Today's alerts fetched", rows);
  } catch (err) {
    return error(res, err.message, err.status || 400);
  }
};
