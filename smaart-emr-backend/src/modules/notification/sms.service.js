const logger = require("../../config/logger");

exports.sendSMS = async ({ to, message }) => {
  try {
    if (!to || !message) {
      throw new Error("SMS parameters missing");
    }

    // Replace with Twilio or provider integration
    console.log("📲 Sending SMS to:", to);
    console.log("Message:", message);

    return {
      success: true,
      message: "SMS sent successfully"
    };
  } catch (error) {
    logger.error("SMS Service Error:", error);
    return {
      success: false,
      message: error.message
    };
  }
};
