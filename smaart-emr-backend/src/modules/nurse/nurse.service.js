const mongoose = require("mongoose");
const Vitals = require("./vitals.model");
const Patient = require("../patient/patient.model");
const Appointment = require("../appointment/appointment.model");
const calculateBMI = require("../../utils/calculateBMI");
const ROLES = require("../../config/roles");
const notificationService = require("../notification/notification.service");

exports.recordVitals = async (data, nurseUser) => {
  if (nurseUser.role !== ROLES.NURSE) {
    throw new Error("Access denied");
  }

  let patient = null;

  if (data.patientId) {
    patient =
      (await Patient.findOne({ patientId: data.patientId })) ||
      (mongoose.isValidObjectId(data.patientId)
        ? await Patient.findById(data.patientId)
        : null);
  }

  let appointment = null;
  if (!patient && data.appointmentId) {
    appointment = await Appointment.findOne({
      $or: [{ appointmentId: data.appointmentId }, { _id: data.appointmentId }]
    }).populate("patient");

    if (!appointment) {
      throw new Error("Appointment not found");
    }

    patient = appointment.patient;
  }

  if (!patient) {
    throw new Error("Patient not found");
  }

  const bmi = data.height && data.weight ? calculateBMI(data.height, data.weight) : null;
  const vitals = await Vitals.create({
    patient: patient._id,
    appointment: appointment?._id || null,
    recordedBy: nurseUser._id,
    height: data.height,
    weight: data.weight,
    bmi,
    bloodPressure: data.bloodPressure,
    pulse: data.pulse,
    temperature: data.temperature,
    oxygenSaturation: data.oxygenSaturation,
    pastMedicalHistory: data.pastMedicalHistory,
    pastSurgicalHistory: data.pastSurgicalHistory,
    allergies: data.allergies,
    currentMedications: data.currentMedications,
    lifestyleFactors: data.lifestyleFactors
  });

  await notificationService.sendVitalsSubmissionNotification({
    patient,
    vitals
  });

  return vitals;
};

exports.getPatientVitals = async (patientId) => {
  const patient =
    (await Patient.findOne({ patientId })) ||
    (mongoose.isValidObjectId(patientId) ? await Patient.findById(patientId) : null);

  if (!patient) {
    throw new Error("Patient not found");
  }

  return Vitals.find({ patient: patient._id })
    .populate("recordedBy", "userId name role")
    .sort({ createdAt: -1 });
};

exports.listVitals = async (filters = {}) => {
  const query = {};

  if (filters.patientId) {
    const patient =
      (await Patient.findOne({ patientId: filters.patientId })) ||
      (mongoose.isValidObjectId(filters.patientId) ? await Patient.findById(filters.patientId) : null);

    if (!patient) {
      throw new Error("Patient not found");
    }
    query.patient = patient._id;
  }

  if (filters.date) {
    const start = new Date(filters.date);
    if (!Number.isNaN(start.getTime())) {
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      query.createdAt = { $gte: start, $lt: end };
    }
  }

  return Vitals.find(query)
    .populate("patient", "patientId firstName lastName")
    .populate("recordedBy", "userId name role")
    .sort({ createdAt: -1 })
    .limit(200);
};
