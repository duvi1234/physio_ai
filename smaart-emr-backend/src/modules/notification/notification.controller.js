const notificationService = require("./notification.service");
const { success, error } = require("../../utils/responseHandler");

exports.sendCustom = async (req, res) => {
  try {
    const { phone, email, message, subject } = req.body;

    await notificationService.sendCustomNotification({
      phone,
      email,
      message,
      subject
    });

    return success(res, "Notification sent successfully");
  } catch (err) {
    return error(res, err.message, err.status || 400);
  }
};
