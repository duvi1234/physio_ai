const nodemailer = require("nodemailer");

const env = (key, fallback = "") => String(process.env[key] || fallback).trim();
const isPlaceholder = (value = "") =>
  ["yourgmail@gmail.com", "your_gmail_app_password", "your-email@gmail.com", "changeme"].includes(
    String(value).trim().toLowerCase()
  );
const firstNonEmpty = (...values) => values.find((v) => String(v || "").trim()) || "";

const getTransporter = () => {
  const service = env("EMAIL_SERVICE", "gmail").toLowerCase();
  const emailUser = env("EMAIL_USER");
  const emailPass = firstNonEmpty(
    env("EMAIL_PASS"),
    env("EMAIL_PASSWORD"),
    env("GMAIL_APP_PASSWORD")
  );
  const smtpHost = env("SMTP_HOST");
  const smtpPort = Number(env("SMTP_PORT", "587"));
  const smtpSecure = env("SMTP_SECURE", "false").toLowerCase() === "true";
  const smtpUser = firstNonEmpty(env("SMTP_USER"), env("EMAIL_USER"));
  const smtpPass = firstNonEmpty(env("SMTP_PASS"), env("SMTP_PASSWORD"), env("EMAIL_PASS"));

  if (smtpHost) {
    const auth =
      smtpUser && smtpPass
        ? {
            user: smtpUser,
            pass: smtpPass
          }
        : undefined;

    return nodemailer.createTransport({
      host: smtpHost,
      port: Number.isNaN(smtpPort) ? 587 : smtpPort,
      secure: smtpSecure,
      ...(auth ? { auth } : {})
    });
  }

  if (!emailUser || !emailPass || isPlaceholder(emailUser) || isPlaceholder(emailPass)) {
    return null;
  }

  return nodemailer.createTransport({
    service,
    auth: {
      user: emailUser,
      pass: emailPass
    }
  });
};

exports.sendEmail = async ({ to, subject, html }) => {
  try {
    if (!to) throw new Error("Email address required");
    const transporter = getTransporter();
    if (!transporter) {
      throw new Error(
        "Email service is not configured. Set EMAIL_USER and EMAIL_PASS (or EMAIL_PASSWORD/GMAIL_APP_PASSWORD), or configure SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS."
      );
    }

    await transporter.verify();

    const fromAddress = firstNonEmpty(env("EMAIL_FROM"), env("EMAIL_USER"), env("SMTP_USER"));
    if (!fromAddress) {
      throw new Error("Sender email is missing. Set EMAIL_FROM or EMAIL_USER.");
    }

    const mailOptions = {
      from: `"SMAART EMR" <${fromAddress}>`,
      to,
      subject,
      html
    };

    await transporter.sendMail(mailOptions);

    return { success: true };
  } catch (error) {
    console.error("Email Service Error:", error);
    return { success: false, message: error.message };
  }
};
