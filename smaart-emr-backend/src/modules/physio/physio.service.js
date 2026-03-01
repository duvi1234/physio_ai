const mongoose = require("mongoose");
const Appointment = require("../appointment/appointment.model");
const Patient = require("../patient/patient.model");
const Vitals = require("../nurse/vitals.model");
const PainAssessment = require("../nurse/painAssessment.model");
const PainAssessment3D = require("../pain/pain.model");
const MedicalRecord = require("../medicalRecords/medicalRecord.model");
const PostureAnalysis = require("./postureAnalysis.model");
const TreatmentPlan = require("./treatmentPlan.model");
const SessionNote = require("./sessionNote.model");
const generateRoleId = require("../../utils/generateId");
const ROLES = require("../../config/roles");

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(String(value || "").trim());

const resolvePatient = async (patientId) => {
  if (!patientId) return null;
  if (isValidObjectId(patientId)) {
    const byId = await Patient.findById(patientId);
    if (byId) return byId;
  }
  return Patient.findOne({ patientId });
};

const ensurePhysioAccess = async (physioId, patientId) => {
  const patient = await resolvePatient(patientId);
  if (!patient) throw new Error("Patient not found");
  const appointment = await Appointment.findOne({
    patient: patient._id,
    $or: [{ physiotherapist: physioId }, { physio: physioId }],
    isActive: true
  });
  if (!appointment) throw new Error("Access denied for this patient");
  return patient;
};

exports.getDashboardStats = async (physioUser) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [todayAppointments, completedToday, pendingAssessments, followUpsDue, activePlans] = await Promise.all([
    Appointment.countDocuments({
      $or: [{ physiotherapist: physioUser._id }, { physio: physioUser._id }],
      appointmentDate: { $gte: today, $lt: tomorrow },
      isActive: true
    }),
    Appointment.countDocuments({
      $or: [{ physiotherapist: physioUser._id }, { physio: physioUser._id }],
      completedAt: { $gte: today, $lt: tomorrow }
    }),
    PostureAnalysis.countDocuments({
      physiotherapist: physioUser._id,
      createdAt: { $gte: today, $lt: tomorrow }
    }),
    SessionNote.countDocuments({
      physiotherapist: physioUser._id,
      followUpDate: { $lte: tomorrow, $gte: today }
    }),
    TreatmentPlan.countDocuments({
      physiotherapist: physioUser._id,
      status: "ACTIVE",
      isActive: true
    })
  ]);

  return {
    todayAppointments,
    completedToday,
    pendingAssessments,
    followUpsDue,
    activePlans
  };
};

exports.listAppointments = async (physioUser, query = {}) => {
  const filter = {
    $or: [{ physiotherapist: physioUser._id }, { physio: physioUser._id }],
    isActive: true
  };

  if (query.status) {
    filter.status = String(query.status).toUpperCase();
  }

  if (query.tab === "TODAY") {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    filter.appointmentDate = { $gte: start, $lt: end };
  } else if (query.tab === "UPCOMING") {
    filter.appointmentDate = { $gte: new Date() };
  } else if (query.tab === "COMPLETED") {
    filter.status = "COMPLETED";
  }

  if (query.search) {
    const q = String(query.search).trim();
    const patients = await Patient.find({
      $or: [
        { patientId: { $regex: q, $options: "i" } },
        { firstName: { $regex: q, $options: "i" } },
        { lastName: { $regex: q, $options: "i" } },
        { phone: { $regex: q, $options: "i" } }
      ]
    }).select("_id");
    filter.patient = { $in: patients.map((p) => p._id) };
  }

  return Appointment.find(filter)
    .populate("patient", "patientId firstName lastName phone")
    .populate("assignedTo", "userId nurseId name role")
    .populate("nurse", "userId nurseId name role")
    .sort({ appointmentDate: 1, timeSlot: 1 });
};

exports.getPatientCase = async (physioUser, patientId) => {
  const patient = await ensurePhysioAccess(physioUser._id, patientId);

  const [appointments, vitals, painAssessments, painAssessments3D, records, posture, plans, notes] = await Promise.all([
    Appointment.find({ patient: patient._id })
      .populate("physiotherapist", "userId physioId name role")
      .populate("physio", "userId physioId name role")
      .populate("assignedTo", "userId nurseId name role")
      .populate("nurse", "userId nurseId name role")
      .sort({ appointmentDate: -1 })
      .limit(50),
    Vitals.find({ patient: patient._id, isActive: true })
      .populate("recordedBy", "userId nurseId name role")
      .sort({ recordedAt: -1 })
      .limit(50),
    PainAssessment.find({ patient: patient._id, isActive: true })
      .populate("nurse", "userId nurseId name role")
      .sort({ createdAt: -1 })
      .limit(50),
    PainAssessment3D.find({ patientId: patient._id })
      .populate("createdBy", "userId nurseId physioId name role")
      .sort({ createdAt: -1 })
      .limit(100),
    MedicalRecord.find({ patient: patient._id, isActive: true }).sort({ createdAt: -1 }).limit(50),
    PostureAnalysis.find({ patient: patient._id, isActive: true }).sort({ createdAt: -1 }).limit(20),
    TreatmentPlan.find({ patient: patient._id, isActive: true }).sort({ createdAt: -1 }).limit(20),
    SessionNote.find({ patient: patient._id, isActive: true }).sort({ createdAt: -1 }).limit(20)
  ]);

  return {
    patient,
    appointments,
    vitals,
    painAssessments: [
      ...painAssessments,
      ...painAssessments3D.flatMap((row) =>
        (Array.isArray(row.painEntries) ? row.painEntries : []).map((entry) => ({
          _id: `${row._id}-${entry.entryId || entry.createdAt || ""}`,
          bodyArea: entry.bodyPart,
          painScore: entry.intensity,
          painType: entry.type,
          description: entry.notes,
          createdAt: entry.createdAt || row.createdAt,
          nurse: row.createdBy
        }))
      )
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    records,
    posture,
    plans,
    notes
  };
};

exports.createPostureAnalysis = async (physioUser, payload) => {
  const patient = await ensurePhysioAccess(physioUser._id, payload.patientId);

  let appointment = null;
  if (payload.appointmentId) {
    appointment = await Appointment.findOne({
      $or: [{ appointmentId: payload.appointmentId }, { _id: payload.appointmentId }]
    });
  }

  return PostureAnalysis.create({
    analysisId: await generateRoleId("POSTURE_ANALYSIS"),
    patient: patient._id,
    physiotherapist: physioUser._id,
    appointment: appointment?._id || null,
    images: payload.images || {},
    aiResult: payload.aiResult || {},
    manualCorrections: payload.manualCorrections || "",
    comments: payload.comments || "",
    isActive: true
  });
};

exports.createTreatmentPlan = async (physioUser, payload) => {
  const patient = await ensurePhysioAccess(physioUser._id, payload.patientId);

  let appointment = null;
  if (payload.appointmentId) {
    appointment = await Appointment.findOne({
      $or: [{ appointmentId: payload.appointmentId }, { _id: payload.appointmentId }]
    });
  }

  return TreatmentPlan.create({
    planId: await generateRoleId("TREATMENT_PLAN"),
    patient: patient._id,
    physiotherapist: physioUser._id,
    appointment: appointment?._id || null,
    summary: payload.summary || "",
    exercises: Array.isArray(payload.exercises) ? payload.exercises : [],
    aiSuggested: payload.aiSuggested || {},
    status: payload.status || "ACTIVE",
    isActive: true
  });
};

exports.createSessionNote = async (physioUser, payload) => {
  if (!payload.appointmentId) {
    throw new Error("appointmentId is required");
  }
  const appointment = await Appointment.findOne({
    $or: [{ appointmentId: payload.appointmentId }, { _id: payload.appointmentId }]
  });
  if (!appointment) throw new Error("Appointment not found");
  if (![String(appointment.physiotherapist || ""), String(appointment.physio || "")].includes(String(physioUser._id))) {
    throw new Error("Access denied for this appointment");
  }

  const note = await SessionNote.create({
    sessionNoteId: await generateRoleId("SESSION_NOTE"),
    appointment: appointment._id,
    patient: appointment.patient,
    physiotherapist: physioUser._id,
    diagnosis: payload.diagnosis || "",
    observations: payload.observations || "",
    treatmentGiven: payload.treatmentGiven || "",
    recommendations: payload.recommendations || "",
    followUpDate: payload.followUpDate ? new Date(payload.followUpDate) : null,
    isActive: true
  });

  if (payload.markCompleted) {
    appointment.status = "COMPLETED";
    appointment.completedAt = new Date();
    await appointment.save();
  }

  return note;
};

exports.updateAppointmentStatus = async (physioUser, appointmentId, status) => {
  const appointment = await Appointment.findOne({
    $or: [{ appointmentId }, { _id: appointmentId }]
  });
  if (!appointment) throw new Error("Appointment not found");
  if (![String(appointment.physiotherapist || ""), String(appointment.physio || "")].includes(String(physioUser._id))) {
    throw new Error("Access denied for this appointment");
  }

  const normalized = String(status || "").toUpperCase();
  const allowed = ["IN_SESSION", "COMPLETED"];
  if (!allowed.includes(normalized)) {
    throw new Error("Invalid status update");
  }
  appointment.status = normalized;
  if (normalized === "COMPLETED") {
    appointment.completedAt = new Date();
  }
  await appointment.save();
  return appointment;
};

exports.getAnalytics = async (physioUser, patientId) => {
  const patient = await ensurePhysioAccess(physioUser._id, patientId);

  const painAssessments = await PainAssessment.find({ patient: patient._id, isActive: true })
    .sort({ createdAt: 1 })
    .limit(50);

  const posture = await PostureAnalysis.find({ patient: patient._id, isActive: true })
    .sort({ createdAt: 1 })
    .limit(30);

  const painLabels = painAssessments.map((row) => row.createdAt.toLocaleDateString());
  const painData = painAssessments.map((row) => row.painScore || 0);

  const postureLabels = posture.map((row) => row.createdAt.toLocaleDateString());
  const postureData = posture.map((row) => row.aiResult?.raw?.score || 0);

  return {
    painTrend: {
      labels: painLabels,
      datasets: [{ label: "Pain Score", data: painData }]
    },
    postureTrend: {
      labels: postureLabels,
      datasets: [{ label: "Posture Score", data: postureData }]
    }
  };
};
