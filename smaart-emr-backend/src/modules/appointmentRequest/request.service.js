const AppointmentRequest = require("./request.model");
const generateUniqueId = require("../../utils/generateUniqueId");
const notificationService = require("../notification/notification.service");
const patientService = require("../patient/patient.service");
const appointmentService = require("../appointment/appointment.service");

exports.createRequest = async (data) => {
  const requestId = await generateUniqueId("REQUEST");

  const request = await AppointmentRequest.create({
    requestId,
    fullName: data.fullName,
    phone: data.phone,
    email: data.email,
    department: data.department,
    location: data.location,
    preferredDate: data.preferredDate,
    preferredTimeSlot: data.preferredTimeSlot,
    description: data.description
  });

  await notificationService.sendAppointmentRequestReceived({
    name: request.fullName,
    phone: request.phone,
    email: request.email
  });

  return request;
};

exports.getAllRequests = async () => {
  return AppointmentRequest.find()
    .sort({ createdAt: -1 })
    .populate("handledBy", "uniqueId role");
};

exports.updateRequestStatus = async (
  requestId,
  status,
  adminUser
) => {
  const request = await AppointmentRequest.findOne({
    requestId
  });

  if (!request)
    throw new Error("Request not found");

  request.status = String(status || "").toUpperCase();
  request.handledBy = adminUser._id;

  await request.save();

  return request;
};

exports.convertRequestToPatientAndAppointment = async (requestId, payload, adminUser) => {
  const request = await AppointmentRequest.findOne({ requestId });
  if (!request) {
    throw new Error("Request not found");
  }

  const createdPatient = await patientService.createPatient({
    name: request.fullName,
    phone: request.phone,
    email: request.email,
    gender: payload.gender || "Other",
    dateOfBirth: payload.dateOfBirth || "2000-01-01",
    address: payload.address || request.location
  });
  const patient = createdPatient.patient;

  const appointment = await appointmentService.createAppointment(
    {
      patientId: patient.patientId,
      physiotherapistId: payload.physiotherapistId,
      appointmentDate: payload.appointmentDate || request.preferredDate || new Date(),
      timeSlot: payload.timeSlot || request.preferredTimeSlot || "09:00 - 10:00",
      location: payload.location || request.location || "Main Clinic",
      appointmentType: payload.appointmentType || "WALK_IN",
      notes: payload.notes || request.description || "",
      assignedTo: payload.assignedTo
    },
    adminUser
  );

  request.status = "CONVERTED";
  request.handledBy = adminUser._id;
  await request.save();

  return {
    request,
    patient,
    appointment,
    temporaryPassword: createdPatient.temporaryPassword
  };
};
