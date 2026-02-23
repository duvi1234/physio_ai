const Appointment = require("./appointment.model");
const Patient = require("../patient/patient.model");
const User = require("../user/user.model");
const generateUniqueId = require("../../utils/generateUniqueId");
const ROLES = require("../../config/roles");
const notificationService = require("../notification/notification.service");

const normalizeStatus = (status) => String(status || "").toUpperCase();

exports.createAppointment = async (data, bookedByUser) => {
  let patient = null;

  if (bookedByUser.role === ROLES.PATIENT) {
    patient = await Patient.findOne({ user: bookedByUser._id });
  }

  if (!patient && data.patientId) {
    patient = await Patient.findOne({ patientId: data.patientId });
  }

  if (!patient) {
    throw new Error("Patient not found");
  }

  const physio = await User.findOne({
    $or: [{ _id: data.physiotherapistId }, { userId: data.physiotherapistId }, { physioId: data.physiotherapistId }],
    role: { $in: [ROLES.CONSULTANT, ROLES.PHYSIO, ROLES.PHYSIOTHERAPIST] }
  });

  if (!physio) {
    throw new Error("Invalid physiotherapist");
  }

  const conflict = await Appointment.findOne({
    physiotherapist: physio._id,
    appointmentDate: new Date(data.appointmentDate),
    timeSlot: data.timeSlot,
    status: { $in: ["PENDING", "CONFIRMED"] }
  });

  if (conflict) {
    throw new Error("Time slot already booked");
  }

  const appointmentId = await generateUniqueId("APPOINTMENT");
  let assignedTo = null;
  if (data.assignedTo) {
    const assignedNurse = await User.findOne({
      $or: [{ _id: data.assignedTo }, { userId: data.assignedTo }, { nurseId: data.assignedTo }],
      role: ROLES.NURSE
    }).select("_id");
    assignedTo = assignedNurse?._id || null;
  }

  const appointment = await Appointment.create({
    appointmentId,
    patient: patient._id,
    physiotherapist: physio._id,
    bookedBy: bookedByUser._id,
    assignedTo,
    appointmentDate: new Date(data.appointmentDate),
    timeSlot: data.timeSlot,
    location: data.location,
    appointmentType: data.appointmentType || "WALK_IN",
    notes: data.notes || "",
    status: "CONFIRMED"
  });

  await notificationService.sendAppointmentConfirmation({ patient, appointment, consultant: physio });

  return appointment;
};

exports.getAppointmentsForUser = async (user) => {
  if ([ROLES.ADMIN, ROLES.SUPER_ADMIN].includes(user.role)) {
    return Appointment.find()
      .populate("patient")
      .populate("physiotherapist", "userId name role email phone")
      .sort({ appointmentDate: -1 });
  }

  if ([ROLES.CONSULTANT, ROLES.PHYSIO, ROLES.PHYSIOTHERAPIST].includes(user.role)) {
    return Appointment.find({ physiotherapist: user._id })
      .populate("patient")
      .sort({ appointmentDate: 1 });
  }

  if (user.role === ROLES.PATIENT) {
    const patient = await Patient.findOne({ user: user._id });
    if (!patient) {
      return [];
    }

    return Appointment.find({ patient: patient._id })
      .populate("physiotherapist", "userId name role email phone")
      .sort({ appointmentDate: 1 });
  }

  return [];
};

exports.listAppointments = async (query = {}, user) => {
  const filter = {};
  const isAdmin = [ROLES.ADMIN, ROLES.SUPER_ADMIN].includes(user.role);
  const isConsultant = [ROLES.CONSULTANT, ROLES.PHYSIO, ROLES.PHYSIOTHERAPIST].includes(user.role);

  if (query.consultantId) {
    const consultant = await User.findOne({
      $or: [{ _id: query.consultantId }, { userId: query.consultantId }, { physioId: query.consultantId }]
    }).select("_id");
    if (consultant) {
      filter.physiotherapist = consultant._id;
    } else {
      filter.physiotherapist = query.consultantId;
    }
  }

  if (query.patientId) {
    const patient =
      (await Patient.findOne({ patientId: query.patientId })) ||
      (await Patient.findById(query.patientId));
    if (!patient) {
      throw new Error("Patient not found");
    }
    filter.patient = patient._id;
  }

  if (query.assignedTo) {
    const nurse = await User.findOne({
      $or: [{ _id: query.assignedTo }, { userId: query.assignedTo }, { nurseId: query.assignedTo }],
      role: ROLES.NURSE
    }).select("_id");
    const nurseId = nurse?._id || query.assignedTo;
    filter.$or = [{ assignedTo: nurseId }, { bookedBy: nurseId }];
  }

  if (query.date) {
    const start = new Date(query.date);
    if (!Number.isNaN(start.getTime())) {
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      filter.appointmentDate = { $gte: start, $lt: end };
    }
  }

  if (!isAdmin) {
    if (user.role === ROLES.NURSE) {
      filter.$or = [{ assignedTo: user._id }, { bookedBy: user._id }];
    } else if (isConsultant) {
      filter.physiotherapist = user._id;
    } else if (user.role === ROLES.PATIENT) {
      const selfPatient = await Patient.findOne({ user: user._id });
      if (!selfPatient) return [];
      filter.patient = selfPatient._id;
    }
  }

  return Appointment.find(filter)
    .populate("patient")
    .populate("physiotherapist", "userId name role email phone")
    .populate("assignedTo", "userId name role email phone")
    .sort({ appointmentDate: -1 });
};

exports.updateAppointmentStatus = async (appointmentId, status) => {
  const normalizedStatus = normalizeStatus(status);
  const appointment = await Appointment.findOne({
    $or: [{ appointmentId }, { _id: appointmentId }]
  });

  if (!appointment) {
    throw new Error("Appointment not found");
  }

  appointment.status = normalizedStatus;
  if (normalizedStatus === "CONFIRMED") {
    appointment.reminderSent = false;
  }
  if (normalizedStatus === "COMPLETED") {
    appointment.completedAt = new Date();
  }

  await appointment.save();
  return appointment;
};
