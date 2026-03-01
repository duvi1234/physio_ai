const smsService = require("./sms.service");
const emailService = require("./email.service");

const safeSend = async (phone, email, subject, message, html) => {
  const result = {
    smsSent: false,
    emailSent: false,
    smsError: null,
    emailError: null
  };

  if (phone) {
    const smsRes = await smsService.sendSMS({ to: phone, message });
    result.smsSent = Boolean(smsRes?.success);
    result.smsError = smsRes?.success ? null : smsRes?.message || "SMS delivery failed";
  }

  if (email) {
    const emailRes = await emailService.sendEmail({
      to: email,
      subject,
      html: html || `<p>${message}</p>`
    });
    result.emailSent = Boolean(emailRes?.success);
    result.emailError = emailRes?.success ? null : emailRes?.message || "Email delivery failed";
  }

  return result;
};

exports.sendAppointmentConfirmation = async ({ patient, appointment, consultant }) => {
  const consultantName = consultant?.name || appointment?.consultantName || "Assigned Consultant";
  const appointmentDate = appointment?.appointmentDate
    ? new Date(appointment.appointmentDate).toLocaleDateString()
    : appointment?.date || "TBD";
  const timeSlot = appointment?.timeSlot || appointment?.time || "TBD";

  const message = `Dear ${patient?.firstName || "Patient"}, your appointment is confirmed for ${appointmentDate} at ${timeSlot} with ${consultantName}.`;
  const html = `
    <h3>Appointment Confirmed</h3>
    <p><b>Date:</b> ${appointmentDate}</p>
    <p><b>Time:</b> ${timeSlot}</p>
    <p><b>Consultant:</b> ${consultantName}</p>
  `;

  return safeSend(patient?.phone, patient?.email, "Appointment Confirmation", message, html);
};

exports.sendAppointmentRequestReceived = async ({ name, phone, email }) => {
  const message = `Dear ${name || "Patient"}, thank you. Our admin will contact you shortly to confirm your appointment request.`;
  return safeSend(phone, email, "Appointment Request Received", message, `<p>${message}</p>`);
};

exports.sendVitalsSubmissionNotification = async ({ patient, vitals }) => {
  const message = `Vitals recorded for ${patient?.firstName || "patient"} on ${new Date(vitals.createdAt).toLocaleString()}.`;
  return safeSend(patient?.phone, patient?.email, "Vitals Submission Update", message, `<p>${message}</p>`);
};

exports.sendCustomNotification = async ({ phone, email, message, subject }) => {
  return safeSend(phone, email, subject || "Notification", message, `<p>${message}</p>`);
};
