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
  return AppointmentRequest.find({ isActive: true })
    .sort({ createdAt: -1 })
    .populate("handledBy", "userId role");
};

exports.listRequests = async (filters = {}, skip = 0, limit = 20) => {
  const query = { isActive: filters.isActive !== undefined ? filters.isActive : true };
  if (filters.status && filters.status !== "ALL") {
    query.status = String(filters.status).toUpperCase();
  }
  if (filters.search) {
    const q = String(filters.search).trim();
    query.$or = [
      { requestId: { $regex: q, $options: "i" } },
      { fullName: { $regex: q, $options: "i" } },
      { phone: { $regex: q, $options: "i" } }
    ];
  }
  return AppointmentRequest.find(query)
    .sort({ createdAt: -1 })
    .skip(Number(skip))
    .limit(Number(limit))
    .populate("handledBy", "userId role");
};

exports.countRequests = async (filters = {}) => {
  const query = { isActive: filters.isActive !== undefined ? filters.isActive : true };
  if (filters.status && filters.status !== "ALL") {
    query.status = String(filters.status).toUpperCase();
  }
  if (filters.search) {
    const q = String(filters.search).trim();
    query.$or = [
      { requestId: { $regex: q, $options: "i" } },
      { fullName: { $regex: q, $options: "i" } },
      { phone: { $regex: q, $options: "i" } }
    ];
  }
  return AppointmentRequest.countDocuments(query);
};

exports.getRequestById = async (requestId) => {
  return AppointmentRequest.findOne({
    $or: [{ requestId }, { _id: requestId }]
  }).populate("handledBy", "userId role");
};

exports.updateRequest = async (requestId, payload = {}) => {
  return AppointmentRequest.findOneAndUpdate(
    { $or: [{ requestId }, { _id: requestId }] },
    payload,
    { new: true }
  );
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
    addressLine1: payload.addressLine1 || payload.address || request.location || "",
    addressLine2: payload.addressLine2 || "",
    city: payload.city || "",
    state: payload.state || "",
    postalCode: payload.postalCode || "",
    country: payload.country || "India",
    emergencyContactName: payload.emergencyContactName || request.fullName || "Primary Contact",
    emergencyContactRelationship: payload.emergencyContactRelationship || "Self",
    emergencyContactPhone: payload.emergencyContactPhone || request.phone
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

  request.status = "APPROVED";
  request.handledBy = adminUser._id;
  await request.save();

  return {
    request,
    patient,
    appointment,
    temporaryPassword: createdPatient.temporaryPassword
  };
};
