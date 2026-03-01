const mongoose = require("mongoose");
const Vitals = require("./vitals.model");
const Patient = require("../patient/patient.model");
const Appointment = require("../appointment/appointment.model");
const PainAssessment = require("./painAssessment.model");
const NurseNote = require("./nurseNote.model");
const calculateBMI = require("../../utils/calculateBMI");
const generateRoleId = require("../../utils/generateId");
const ROLES = require("../../config/roles");
const notificationService = require("../notification/notification.service");
const alertService = require("../alerts/alert.service");

const isSameDay = (dateInput) => {
  if (!dateInput) return false;
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return false;
  const now = new Date();
  return date.toDateString() === now.toDateString();
};

const ensureNurseAccessToAppointment = (appointment, nurseUser) => {
  if (!appointment) return false;
  return (
    String(appointment.assignedTo || "") === String(nurseUser._id) ||
    String(appointment.nurse || "") === String(nurseUser._id)
  );
};

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

  if (
    appointment &&
    ![
      String(appointment.assignedTo || ""),
      String(appointment.nurse || "")
    ].includes(String(nurseUser._id))
  ) {
    throw new Error("Access denied for this appointment");
  }

  if (!appointment) {
    const assigned = await Appointment.findOne({
      patient: patient._id,
      $or: [{ assignedTo: nurseUser._id }, { nurse: nurseUser._id }],
      isActive: true
    }).select("_id");
    if (!assigned) {
      throw new Error("Access denied for this patient");
    }
  }

  const bmi = data.height && data.weight ? calculateBMI(data.height, data.weight) : null;
  const customRecordedAt = data.recordedAt ? new Date(data.recordedAt) : null;
  const recordedAt =
    customRecordedAt && !Number.isNaN(customRecordedAt.getTime()) ? customRecordedAt : new Date();

  const vitals = await Vitals.create({
    vitalsId: await generateRoleId("VITALS"),
    patient: patient._id,
    appointment: appointment?._id || null,
    recordedBy: nurseUser._id,
    recordedAt,
    height: data.height,
    weight: data.weight,
    bmi,
    bloodPressure: data.bloodPressure,
    pulse: data.pulse,
    temperature: data.temperature,
    oxygenSaturation: data.oxygenSaturation,
    painScale: data.painScale,
    painAffectedArea: data.painAffectedArea,
    painNotes: data.painNotes,
    swelling: data.swelling,
    visibleInflammation: data.visibleInflammation,
    mobilityLimitation: data.mobilityLimitation ? String(data.mobilityLimitation).toUpperCase() : "",
    pastMedicalHistory: data.pastMedicalHistory,
    pastSurgicalHistory: data.pastSurgicalHistory,
    allergies: data.allergies,
    currentMedications: data.currentMedications,
    lifestyleFactors: data.lifestyleFactors,
    isActive: true
  });

  if (appointment?._id && data.markReadyForPT) {
    appointment.status = "READY_FOR_PT";
    await appointment.save();
  }

  await notificationService.sendVitalsSubmissionNotification({
    patient,
    vitals
  });

  await alertService.createAutoAlertsFromVitals({
    patient,
    appointment,
    vitals,
    actorUser: nurseUser
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

  return Vitals.find({ patient: patient._id, isActive: true })
    .populate("recordedBy", "userId nurseId name role")
    .sort({ recordedAt: -1, createdAt: -1 });
};

exports.listVitals = async (filters = {}) => {
  const query = {};
  if (filters.isActive !== undefined) {
    query.isActive = filters.isActive === "false" ? false : Boolean(filters.isActive);
  } else {
    query.isActive = true;
  }

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
    .populate("recordedBy", "userId nurseId name role")
    .populate("appointment", "appointmentId appointmentDate timeSlot status")
    .sort({ recordedAt: -1, createdAt: -1 })
    .limit(200);
};

exports.updateVitals = async (vitalsId, data, actorUser) => {
  const row = await Vitals.findById(vitalsId);
  if (!row) {
    throw new Error("Vitals record not found");
  }

  if (String(actorUser.role || "").toUpperCase() === ROLES.NURSE) {
    if (String(row.recordedBy) !== String(actorUser._id)) {
      throw new Error("Access denied to update this vitals record");
    }
    if (!isSameDay(row.recordedAt || row.createdAt)) {
      throw new Error("Vitals can only be updated on the same day");
    }
  }

  const allowed = [
    "height",
    "weight",
    "bloodPressure",
    "pulse",
    "temperature",
    "oxygenSaturation",
    "painScale",
    "painAffectedArea",
    "painNotes",
    "swelling",
    "visibleInflammation",
    "mobilityLimitation",
    "pastMedicalHistory",
    "pastSurgicalHistory",
    "allergies",
    "currentMedications",
    "lifestyleFactors",
    "recordedAt"
  ];

  allowed.forEach((field) => {
    if (data[field] !== undefined) {
      row[field] = field === "mobilityLimitation" ? String(data[field] || "").toUpperCase() : data[field];
    }
  });

  if (row.height && row.weight) {
    row.bmi = calculateBMI(row.height, row.weight);
  }

  await row.save();
  return Vitals.findById(row._id)
    .populate("patient", "patientId firstName lastName")
    .populate("recordedBy", "userId nurseId name role")
    .populate("appointment", "appointmentId appointmentDate timeSlot status");
};

exports.deleteVitals = async (vitalsId, actorUser) => {
  const row = await Vitals.findById(vitalsId);
  if (!row) {
    throw new Error("Vitals record not found");
  }

  if (String(actorUser.role || "").toUpperCase() === ROLES.NURSE) {
    if (String(row.recordedBy) !== String(actorUser._id)) {
      throw new Error("Access denied to delete this vitals record");
    }
    if (!isSameDay(row.recordedAt || row.createdAt)) {
      throw new Error("Vitals can only be deleted on the same day");
    }
  }

  row.isActive = false;
  await row.save();
  return row;
};

// ==================== Pain Assessments ====================
exports.createPainAssessment = async (data, nurseUser) => {
  if (nurseUser.role !== ROLES.NURSE) {
    throw new Error("Access denied");
  }
  if (!data.patientId || data.painScore === undefined || data.painScore === null || !data.bodyArea) {
    throw new Error("patientId, painScore and bodyArea are required");
  }

  const patient =
    (await Patient.findOne({ patientId: data.patientId })) ||
    (mongoose.isValidObjectId(data.patientId) ? await Patient.findById(data.patientId) : null);
  if (!patient) throw new Error("Patient not found");

  let appointment = null;
  if (data.appointmentId) {
    appointment = await Appointment.findOne({
      $or: [{ appointmentId: data.appointmentId }, { _id: data.appointmentId }]
    });
  }

  if (
    appointment &&
    ![
      String(appointment.assignedTo || ""),
      String(appointment.nurse || "")
    ].includes(String(nurseUser._id))
  ) {
    throw new Error("Access denied for this appointment");
  }

  if (!appointment) {
    const assigned = await Appointment.findOne({
      patient: patient._id,
      $or: [{ assignedTo: nurseUser._id }, { nurse: nurseUser._id }],
      isActive: true
    }).select("_id");
    if (!assigned) {
      throw new Error("Access denied for this patient");
    }
  }

  return PainAssessment.create({
    assessmentId: await generateRoleId("PAIN_ASSESSMENT"),
    patient: patient._id,
    appointment: appointment?._id || null,
    nurse: nurseUser._id,
    painScore: data.painScore,
    bodyArea: data.bodyArea,
    painType: data.painType || "",
    description: data.description || "",
    isActive: true
  });
};

exports.listPainAssessments = async (filters = {}, nurseUser) => {
  const query = { isActive: true };
  if (filters.patientId) {
    const patient =
      (await Patient.findOne({ patientId: filters.patientId })) ||
      (mongoose.isValidObjectId(filters.patientId) ? await Patient.findById(filters.patientId) : null);
    if (!patient) throw new Error("Patient not found");
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
  if (filters.appointmentId) {
    const appointment = await Appointment.findOne({
      $or: [{ appointmentId: filters.appointmentId }, { _id: filters.appointmentId }]
    });
    if (appointment) query.appointment = appointment._id;
  }

  if (String(nurseUser.role || "").toUpperCase() === ROLES.NURSE) {
    query.nurse = nurseUser._id;
  }

  return PainAssessment.find(query)
    .populate("patient", "patientId firstName lastName")
    .populate("nurse", "userId nurseId name role")
    .populate("appointment", "appointmentId appointmentDate timeSlot status")
    .sort({ createdAt: -1 })
    .limit(200);
};

exports.updatePainAssessment = async (assessmentId, data, nurseUser) => {
  const row = await PainAssessment.findOne({
    $or: [{ assessmentId }, { _id: assessmentId }]
  });
  if (!row) throw new Error("Pain assessment not found");

  if (String(nurseUser.role || "").toUpperCase() === ROLES.NURSE) {
    if (String(row.nurse) !== String(nurseUser._id)) {
      throw new Error("Access denied to update this assessment");
    }
    if (!isSameDay(row.createdAt)) {
      throw new Error("Pain assessment can only be updated on the same day");
    }
  }

  ["painScore", "bodyArea", "painType", "description", "isActive"].forEach((field) => {
    if (data[field] !== undefined) row[field] = data[field];
  });

  await row.save();
  return PainAssessment.findById(row._id)
    .populate("patient", "patientId firstName lastName")
    .populate("nurse", "userId nurseId name role")
    .populate("appointment", "appointmentId appointmentDate timeSlot status");
};

exports.deletePainAssessment = async (assessmentId, nurseUser) => {
  const row = await PainAssessment.findOne({
    $or: [{ assessmentId }, { _id: assessmentId }]
  });
  if (!row) throw new Error("Pain assessment not found");

  if (String(nurseUser.role || "").toUpperCase() === ROLES.NURSE) {
    if (String(row.nurse) !== String(nurseUser._id)) {
      throw new Error("Access denied to delete this assessment");
    }
    if (!isSameDay(row.createdAt)) {
      throw new Error("Pain assessment can only be deleted on the same day");
    }
  }

  row.isActive = false;
  await row.save();
  return row;
};

// ==================== Nurse Notes ====================
exports.createNurseNote = async (data, nurseUser) => {
  if (nurseUser.role !== ROLES.NURSE) {
    throw new Error("Access denied");
  }
  if (!data.appointmentId || !data.observation) {
    throw new Error("appointmentId and observation are required");
  }
  const appointment = await Appointment.findOne({
    $or: [{ appointmentId: data.appointmentId }, { _id: data.appointmentId }]
  }).populate("patient");
  if (!appointment) throw new Error("Appointment not found");
  if (!ensureNurseAccessToAppointment(appointment, nurseUser)) {
    throw new Error("Access denied for this appointment");
  }

  return NurseNote.create({
    noteId: await generateRoleId("NURSE_NOTE"),
    appointment: appointment._id,
    patient: appointment.patient?._id,
    nurse: nurseUser._id,
    observation: data.observation,
    recommendations: data.recommendations || "",
    isActive: true
  });
};

exports.listNurseNotes = async (filters = {}, nurseUser) => {
  const query = { isActive: true };
  if (filters.appointmentId) {
    const appointment = await Appointment.findOne({
      $or: [{ appointmentId: filters.appointmentId }, { _id: filters.appointmentId }]
    });
    if (appointment) query.appointment = appointment._id;
  }
  if (filters.patientId) {
    const patient =
      (await Patient.findOne({ patientId: filters.patientId })) ||
      (mongoose.isValidObjectId(filters.patientId) ? await Patient.findById(filters.patientId) : null);
    if (patient) query.patient = patient._id;
  }
  if (filters.date) {
    const start = new Date(filters.date);
    if (!Number.isNaN(start.getTime())) {
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      query.createdAt = { $gte: start, $lt: end };
    }
  }

  if (String(nurseUser.role || "").toUpperCase() === ROLES.NURSE) {
    query.nurse = nurseUser._id;
  }

  return NurseNote.find(query)
    .populate("patient", "patientId firstName lastName")
    .populate("nurse", "userId nurseId name role")
    .populate("appointment", "appointmentId appointmentDate timeSlot status")
    .sort({ createdAt: -1 })
    .limit(200);
};

exports.updateNurseNote = async (noteId, data, nurseUser) => {
  const row = await NurseNote.findOne({
    $or: [{ noteId }, { _id: noteId }]
  });
  if (!row) throw new Error("Nurse note not found");

  if (String(nurseUser.role || "").toUpperCase() === ROLES.NURSE) {
    if (String(row.nurse) !== String(nurseUser._id)) {
      throw new Error("Access denied to update this note");
    }
    if (!isSameDay(row.createdAt)) {
      throw new Error("Notes can only be updated on the same day");
    }
  }

  ["observation", "recommendations", "isActive"].forEach((field) => {
    if (data[field] !== undefined) row[field] = data[field];
  });
  await row.save();
  return NurseNote.findById(row._id)
    .populate("patient", "patientId firstName lastName")
    .populate("nurse", "userId nurseId name role")
    .populate("appointment", "appointmentId appointmentDate timeSlot status");
};

exports.deleteNurseNote = async (noteId, nurseUser) => {
  const row = await NurseNote.findOne({
    $or: [{ noteId }, { _id: noteId }]
  });
  if (!row) throw new Error("Nurse note not found");

  if (String(nurseUser.role || "").toUpperCase() === ROLES.NURSE) {
    if (String(row.nurse) !== String(nurseUser._id)) {
      throw new Error("Access denied to delete this note");
    }
    if (!isSameDay(row.createdAt)) {
      throw new Error("Notes can only be deleted on the same day");
    }
  }

  row.isActive = false;
  await row.save();
  return row;
};
