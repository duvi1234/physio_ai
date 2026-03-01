const mongoose = require("mongoose");
const Alert = require("./alert.model");
const Patient = require("../patient/patient.model");
const Appointment = require("../appointment/appointment.model");

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(String(value || "").trim());

const resolvePatient = async (patientRef) => {
  if (!patientRef) return null;
  const byCode = await Patient.findOne({ patientId: patientRef }).select("_id patientId");
  if (byCode) return byCode;
  if (isValidObjectId(patientRef)) {
    const byId = await Patient.findById(patientRef).select("_id patientId");
    if (byId) return byId;
  }
  return null;
};

const resolveAppointment = async (appointmentRef) => {
  if (!appointmentRef) return null;
  const row = await Appointment.findOne({
    $or: [{ appointmentId: appointmentRef }, { _id: appointmentRef }]
  }).select("_id");
  return row || null;
};

exports.createAlert = async (payload, actorUser) => {
  const patient = await resolvePatient(payload.patientId || payload.patient);
  if (!patient) {
    throw new Error("Patient not found");
  }

  const appointment = await resolveAppointment(payload.appointmentId || payload.appointment);

  return Alert.create({
    patient: patient._id,
    appointment: appointment?._id || null,
    type: payload.type || "Manual Alert",
    severity: String(payload.severity || "MEDIUM").toUpperCase(),
    message: payload.message,
    source: payload.source || "MANUAL",
    createdBy: actorUser._id
  });
};

exports.listTodayAlerts = async (filters = {}, user) => {
  const start = filters.date ? new Date(filters.date) : new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const query = {
    createdAt: { $gte: start, $lt: end }
  };

  if (filters.patientId) {
    const patient = await resolvePatient(filters.patientId);
    if (patient) {
      query.patient = patient._id;
    } else {
      return [];
    }
  }

  const role = String(user?.role || "").toUpperCase();
  if (role === "PATIENT") {
    const selfPatient = await Patient.findOne({ user: user._id }).select("_id");
    if (!selfPatient) return [];
    query.patient = selfPatient._id;
  }

  return Alert.find(query)
    .populate("patient", "patientId firstName lastName")
    .populate("createdBy", "userId nurseId name role")
    .sort({ createdAt: -1 });
};

exports.createAutoAlertsFromVitals = async ({ patient, appointment, vitals, actorUser }) => {
  const alerts = [];
  const bp = String(vitals?.bloodPressure || "");
  const bpMatch = bp.match(/(\d+)\s*\/\s*(\d+)/);
  if (bpMatch) {
    const systolic = Number(bpMatch[1]);
    const diastolic = Number(bpMatch[2]);
    if (systolic >= 140 || diastolic >= 90) {
      alerts.push({
        type: "High BP",
        severity: systolic >= 160 || diastolic >= 100 ? "CRITICAL" : "HIGH",
        message: `High blood pressure detected (${systolic}/${diastolic}).`
      });
    }
  }

  const painScale = Number(vitals?.painScale || 0);
  if (painScale >= 8) {
    alerts.push({
      type: "Severe Pain",
      severity: painScale >= 9 ? "CRITICAL" : "HIGH",
      message: `Severe pain reported (${painScale}/10).`
    });
  }

  if (vitals?.swelling === true) {
    alerts.push({
      type: "Swelling Observed",
      severity: "MEDIUM",
      message: "Swelling recorded during nurse intake."
    });
  }

  if (!alerts.length) return [];

  const payloads = alerts.map((row) => ({
    patient: patient?._id,
    appointment: appointment?._id || null,
    type: row.type,
    severity: row.severity,
    message: row.message,
    source: "AUTO",
    createdBy: actorUser._id
  }));

  return Alert.insertMany(payloads);
};
