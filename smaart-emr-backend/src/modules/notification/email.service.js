const nodemailer = require("nodemailer");
const logger = require("../../config/logger");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

exports.sendEmail = async ({ to, subject, html }) => {
  try {
    if (!to) throw new Error("Email address required");

    const mailOptions = {
      from: `"SMAART EMR" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    };

    await transporter.sendMail(mailOptions);

    return { success: true };
  } catch (error) {
    logger.error("Email Service Error:", error);
    return { success: false, message: error.message };
  }
};
