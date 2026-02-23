const authService = require("./auth.service");
const { success, error } = require("../../utils/responseHandler");

const requestContext = (req) => ({
  ip: req.ip || req.headers["x-forwarded-for"] || req.socket?.remoteAddress,
  device: req.headers["user-agent"] || "Unknown"
});

exports.registerAdmin = async (req, res) => {
  try {
    const data = await authService.registerAdmin(req.body);
    success(res, "Admin registered successfully", data, 201);
  } catch (err) {
    error(res, err.message);
  }
};

exports.checkAdminExists = async (req, res) => {
  try {
    const data = await authService.checkAdminExists();
    success(res, "Admin existence checked", data);
  } catch (err) {
    error(res, err.message, 500);
  }
};

exports.login = async (req, res) => {
  try {
    const data = await authService.login(req.body, requestContext(req));
    success(res, "Login successful", data);
  } catch (err) {
    error(res, err.message);
  }
};

exports.refresh = async (req, res) => {
  try {
    const data = await authService.refresh(req.body.refreshToken);
    success(res, "Token refreshed", data);
  } catch (err) {
    error(res, err.message, 401);
  }
};

exports.logout = async (req, res) => {
  try {
    await authService.logout(req.user, req.body.refreshToken, requestContext(req));
    success(res, "Logout successful");
  } catch (err) {
    error(res, err.message, 400);
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    await authService.forgotPassword(req.body.identifier);
    success(res, "If the account exists, a reset link has been sent.");
  } catch (err) {
    error(res, err.message);
  }
};

exports.resetPassword = async (req, res) => {
  try {
    await authService.resetPassword(req.body.token, req.body.newPassword);
    success(res, "Password reset successful");
  } catch (err) {
    error(res, err.message);
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { userId, oldPassword, newPassword } = req.body;
    const targetUserId = userId || req.user?._id;
    await authService.changePassword(targetUserId, oldPassword, newPassword);
    success(res, "Password updated successfully");
  } catch (err) {
    error(res, err.message);
  }
};
