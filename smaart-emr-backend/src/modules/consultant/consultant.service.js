const Consultant = require("./consultant.model");
const Appointment = require("../appointment/appointment.model");
const Vitals = require("../nurse/vitals.model");
const Patient = require("../patient/patient.model");
const User = require("../user/user.model");
const userService = require("../user/user.service");
const ROLES = require("../../config/roles");
const { AppError } = require("../../middlewares/error.middleware");

const getConsultantProfile = async (userId) => {
  return Consultant.findOne({ user: userId, isActive: true }).populate(
    "user",
    "userId name email role phone"
  );
};

exports.getMyProfile = async (userId) => {
  const profile = await getConsultantProfile(userId);
  if (!profile) {
    throw new AppError("Consultant profile not found", 404);
  }
  return {
    id: profile._id,
    specialization: profile.specialization,
    qualification: profile.qualification,
    experienceYears: profile.experienceYears,
    consultationFee: profile.consultationFee,
    availability: profile.availability,
    user: profile.user,
    name: profile.user?.name,
    email: profile.user?.email
  };
};

exports.getMyPatients = async (userId) => {
  const appointmentRows = await Appointment.find({
    physiotherapist: userId
  }).populate("patient");

  const map = new Map();
  appointmentRows.forEach((row) => {
    if (row.patient?._id) {
      map.set(String(row.patient._id), row.patient);
    }
  });

  return Array.from(map.values());
};

exports.getPatientVitals = async (patientId) => {
  const patient =
    (await Patient.findOne({ patientId })) ||
    (await Patient.findById(patientId));

  if (!patient) {
    throw new AppError("Patient not found", 404);
  }

  return Vitals.find({ patient: patient._id })
    .populate("recordedBy", "userId name role")
    .sort({ createdAt: -1 });
};

exports.addConsultationNote = async (userId, patientId, data) => {
  const patient =
    (await Patient.findOne({ patientId })) ||
    (await Patient.findById(patientId));

  if (!patient) {
    throw new AppError("Patient not found", 404);
  }

  const appointment = await Appointment.findOne({
    patient: patient._id,
    physiotherapist: userId
  }).sort({ appointmentDate: -1 });

  if (!appointment) {
    throw new AppError("No appointment found for this patient", 404);
  }

  appointment.consultation = {
    diagnosis: data.diagnosis,
    prescription: data.prescription,
    notes: data.notes || "",
    addedAt: new Date()
  };
  await appointment.save();

  return appointment;
};

exports.getPendingAppointments = async (userId) => {
  return Appointment.find({
    physiotherapist: userId,
    status: "PENDING"
  })
    .populate("patient")
    .sort({ appointmentDate: 1 });
};

exports.updateAppointmentStatus = async (userId, appointmentId, status) => {
  const appointment = await Appointment.findOne({
    $or: [{ appointmentId }, { _id: appointmentId }],
    physiotherapist: userId
  });

  if (!appointment) {
    throw new AppError("Appointment not found", 404);
  }

  appointment.status = status;
  await appointment.save();

  return appointment;
};

exports.getDashboardStats = async (userId) => {
  const patientIds = await Appointment.distinct("patient", {
    physiotherapist: userId
  });

  const pending = await Appointment.countDocuments({
    physiotherapist: userId,
    status: "PENDING"
  });

  const confirmed = await Appointment.countDocuments({
    physiotherapist: userId,
    status: "CONFIRMED"
  });

  const completed = await Appointment.countDocuments({
    physiotherapist: userId,
    status: "COMPLETED"
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayAppointments = await Appointment.countDocuments({
    physiotherapist: userId,
    appointmentDate: { $gte: today, $lt: tomorrow }
  });

  return {
    totalPatients: patientIds.length,
    pending,
    confirmed,
    completed,
    todayAppointments
  };
};

exports.listConsultants = async () => {
  return User.find({
    role: { $in: [ROLES.CONSULTANT, ROLES.PHYSIO, ROLES.PHYSIOTHERAPIST] }
  })
    .select("-password")
    .sort({ createdAt: -1 });
};

exports.createConsultant = async (data) => {
  const role = String(data.role || ROLES.CONSULTANT).toUpperCase();
  if (![ROLES.CONSULTANT, ROLES.PHYSIO, ROLES.PHYSIOTHERAPIST].includes(role)) {
    throw new AppError("Invalid consultant role", 400);
  }

  return userService.createStaff(data, role);
};
