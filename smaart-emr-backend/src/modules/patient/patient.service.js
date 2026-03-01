const mongoose = require("mongoose");
const Patient = require("./patient.model");
const generateRoleId = require("../../utils/generateId");
const ROLES = require("../../config/roles");
const User = require("../user/user.model");
const Appointment = require("../appointment/appointment.model");
const Vitals = require("../nurse/vitals.model");
const PainAssessment = require("../nurse/painAssessment.model");
const PainAssessment3D = require("../pain/pain.model");
const Alert = require("../alerts/alert.model");
const generateTempPassword = require("../../utils/tempPassword");
const normalizePhotoPath = (value = "") => {
  if (!value) return "";
  const normalized = String(value).replace(/\\/g, "/");
  const idx = normalized.toLowerCase().indexOf("uploads/");
  if (idx >= 0) return normalized.slice(idx);
  return normalized.replace(/^\/+/, "");
};

const resolvePhysioRef = async (value) => {
  if (!value) return null;
  const lookup = [{ userId: value }, { physioId: value }];
  if (mongoose.Types.ObjectId.isValid(String(value))) {
    lookup.push({ _id: value });
  }
  return User.findOne({
    $or: lookup,
    role: { $in: [ROLES.CONSULTANT, ROLES.PHYSIO, ROLES.PHYSIOTHERAPIST] }
  }).select("_id");
};

const calculateAge = (dobInput) => {
  const dob = new Date(dobInput);
  if (Number.isNaN(dob.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age -= 1;
  return Math.max(age, 0);
};

const splitName = (name = "") => {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) {
    return { firstName: "", lastName: "" };
  }
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" ") || "NA"
  };
};

const formatDuplicateError = (err) => {
  if (!err?.code || err.code !== 11000) return null;
  const key = Object.keys(err.keyPattern || {})[0] || "field";
  return `Duplicate ${key}. Please use a different ${key}.`;
};

exports.createPatient = async (data) => {
  if (!data?.name && !(data?.firstName && data?.lastName)) {
    throw new Error("Patient name is required");
  }
  if (!data?.phone) {
    throw new Error("Patient phone is required");
  }
  if (!data?.gender) {
    throw new Error("Patient gender is required");
  }
  if (!data?.dateOfBirth) {
    throw new Error("Patient dateOfBirth is required");
  }
  if (!data?.emergencyContactName || !data?.emergencyContactRelationship || !data?.emergencyContactPhone) {
    throw new Error("Emergency contact name, relationship and phone are required");
  }

  const fallback = splitName(data.name);

  const normalizedEmail = data.email ? String(data.email).toLowerCase().trim() : null;
  const normalizedPhone = String(data.phone).trim();

  const existing = await Patient.findOne({
    $or: [
      { phone: normalizedPhone },
      ...(normalizedEmail ? [{ email: normalizedEmail }] : [])
    ]
  }).select("phone email");

  if (existing) {
    if (existing.phone === normalizedPhone) {
      throw new Error("Duplicate phone. Please use a different phone.");
    }
    if (normalizedEmail && existing.email === normalizedEmail) {
      throw new Error("Duplicate email. Please use a different email.");
    }
  }

  const existingUser = await User.findOne({
    $or: [
      { phone: normalizedPhone },
      ...(normalizedEmail ? [{ email: normalizedEmail }] : [])
    ]
  }).select("phone email");

  if (existingUser) {
    if (existingUser.phone === normalizedPhone) {
      throw new Error("Duplicate phone. Please use a different phone.");
    }
    if (normalizedEmail && existingUser.email === normalizedEmail) {
      throw new Error("Duplicate email. Please use a different email.");
    }
  }

  let lastErr = null;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    let createdUser = null;
    try {
      const patientId = await generateRoleId(ROLES.PATIENT);
      const temporaryPassword = generateTempPassword();

      const fallbackName = `${data.firstName || fallback.firstName} ${data.lastName || fallback.lastName}`.trim();

      createdUser = await User.create({
        userId: patientId,
        patientId,
        name: fallbackName,
        email: normalizedEmail || undefined,
        phone: normalizedPhone,
        password: temporaryPassword,
        role: ROLES.PATIENT,
        mustChangePassword: true,
        isActive: true
      });

      const assignedPhysio = data.assignedPhysio ? await resolvePhysioRef(data.assignedPhysio) : null;

      const patient = await Patient.create({
        patientId,
        user: createdUser._id,
        firstName: data.firstName || fallback.firstName,
        lastName: data.lastName || fallback.lastName,
        gender: data.gender || "Other",
        dateOfBirth: data.dateOfBirth,
        age: calculateAge(data.dateOfBirth),
        phone: normalizedPhone,
        email: normalizedEmail || undefined,
        addressLine1: data.addressLine1 || "",
        addressLine2: data.addressLine2 || "",
        city: data.city || "",
        state: data.state || "",
        postalCode: data.postalCode || "",
        country: data.country || "",
        address:
          data.address ||
          [data.addressLine1, data.addressLine2, data.city, data.state, data.postalCode, data.country]
            .filter(Boolean)
            .join(", "),
        emergencyContactName: data.emergencyContactName,
        emergencyContactRelationship: data.emergencyContactRelationship,
        emergencyContactPhone: data.emergencyContactPhone,
        assignedPhysio: assignedPhysio?._id || undefined,
        insuranceProvider: data.insuranceProvider,
        insuranceNumber: data.insuranceNumber,
        bloodGroup: data.bloodGroup,
        allergies: Array.isArray(data.allergies) ? data.allergies : []
      });

      return { patient, temporaryPassword };
    } catch (err) {
      if (createdUser?._id) {
        await User.findByIdAndDelete(createdUser._id);
      }

      const duplicateMessage = formatDuplicateError(err);
      if (!duplicateMessage) {
        throw err;
      }
      lastErr = err;
      if (!/patientId|userId/.test(duplicateMessage)) {
        throw new Error(duplicateMessage);
      }
    }
  }

  throw new Error(lastErr ? "Unable to generate unique patient ID. Please retry." : "Unable to create patient.");
};

exports.getPatientById = async (patientId) => {
  const patient =
    (await Patient.findOne({ patientId })) ||
    (await Patient.findById(patientId));

  if (!patient) {
    throw new Error("Patient not found");
  }
  patient.profilePhotoUrl = normalizePhotoPath(patient.profilePhotoUrl);

  return patient;
};

exports.searchPatients = async (query = "") => {
  const q = String(query).trim();

  if (!q) {
    const rows = await Patient.find().sort({ createdAt: -1 }).limit(50);
    rows.forEach((row) => {
      row.profilePhotoUrl = normalizePhotoPath(row.profilePhotoUrl);
    });
    return rows;
  }

  const rows = await Patient.find({
    $or: [
      { patientId: q },
      { phone: q },
      { email: q },
      { firstName: { $regex: q, $options: "i" } },
      { lastName: { $regex: q, $options: "i" } }
    ]
  }).limit(50);
  rows.forEach((row) => {
    row.profilePhotoUrl = normalizePhotoPath(row.profilePhotoUrl);
  });
  return rows;
};

exports.listPatients = async (filters = {}) => {
  if (filters.search) {
    return exports.searchPatients(filters.search);
  }

  const query = {};
  if (filters.patientId) query.patientId = filters.patientId;
  if (filters.phone) query.phone = filters.phone;
  if (filters.email) query.email = filters.email;
  if (filters.date) {
    const dayStart = new Date(filters.date);
    if (!Number.isNaN(dayStart.getTime())) {
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);
      query.createdAt = { $gte: dayStart, $lt: dayEnd };
    }
  }

  const rows = await Patient.find(query).sort({ createdAt: -1 }).limit(100);
  rows.forEach((row) => {
    row.profilePhotoUrl = normalizePhotoPath(row.profilePhotoUrl);
  });
  return rows;
};

exports.listPatientsPaged = async (filters = {}, skip = 0, limit = 20, sort = { createdAt: -1 }) => {
  const query = {};
  if (filters.search) {
    const q = String(filters.search).trim();
    query.$or = [
      { patientId: { $regex: q, $options: "i" } },
      { firstName: { $regex: q, $options: "i" } },
      { lastName: { $regex: q, $options: "i" } },
      { phone: { $regex: q, $options: "i" } }
    ];
  }
  if (filters.isActive !== undefined) {
    query.isActive = filters.isActive;
  }
  if (filters.assignedPhysio) {
    query.assignedPhysio = filters.assignedPhysio;
  }
  const rows = await Patient.find(query)
    .sort(sort)
    .skip(Number(skip))
    .limit(Number(limit));
  rows.forEach((row) => {
    row.profilePhotoUrl = normalizePhotoPath(row.profilePhotoUrl);
  });
  return rows;
};

exports.countPatients = async (filters = {}) => {
  const query = {};
  if (filters.search) {
    const q = String(filters.search).trim();
    query.$or = [
      { patientId: { $regex: q, $options: "i" } },
      { firstName: { $regex: q, $options: "i" } },
      { lastName: { $regex: q, $options: "i" } },
      { phone: { $regex: q, $options: "i" } }
    ];
  }
  if (filters.isActive !== undefined) {
    query.isActive = filters.isActive;
  }
  if (filters.assignedPhysio) {
    query.assignedPhysio = filters.assignedPhysio;
  }
  return Patient.countDocuments(query);
};

exports.updatePatient = async (patientId, data) => {
  const payload = { ...data };
  if (payload.dateOfBirth) {
    payload.age = calculateAge(payload.dateOfBirth);
  }
  if (
    payload.addressLine1 !== undefined ||
    payload.addressLine2 !== undefined ||
    payload.city !== undefined ||
    payload.state !== undefined ||
    payload.postalCode !== undefined ||
    payload.country !== undefined
  ) {
    payload.address = [
      payload.addressLine1,
      payload.addressLine2,
      payload.city,
      payload.state,
      payload.postalCode,
      payload.country
    ]
      .filter(Boolean)
      .join(", ");
  }

  if (payload.assignedPhysio !== undefined) {
    if (payload.assignedPhysio === "" || payload.assignedPhysio === null) {
      payload.assignedPhysio = null;
    } else {
      const physio = await resolvePhysioRef(payload.assignedPhysio);
      if (physio?._id) {
        payload.assignedPhysio = physio._id;
      }
    }
  }

  const patient = await Patient.findOneAndUpdate(
    {
      $or: [{ patientId }, { _id: patientId }]
    },
    payload,
    { new: true }
  );

  if (!patient) {
    throw new Error("Patient not found");
  }
  patient.profilePhotoUrl = normalizePhotoPath(patient.profilePhotoUrl);

  return patient;
};

exports.getPatientByUserId = async (userId) => {
  const user = await User.findById(userId).select("patientId userId");
  let patient = await Patient.findOne({ user: userId });
  if (!patient && user?.patientId) {
    patient = await Patient.findOne({ patientId: user.patientId });
  }
  if (!patient && user?.userId) {
    patient = await Patient.findOne({ patientId: user.userId });
  }
  if (!patient) {
    throw new Error("Patient profile not found");
  }
  patient.profilePhotoUrl = normalizePhotoPath(patient.profilePhotoUrl);
  return patient;
};

exports.updatePatientByUserId = async (userId, data) => {
  const user = await User.findById(userId).select("patientId userId");
  let patient = await Patient.findOne({ user: userId });
  if (!patient && user?.patientId) {
    patient = await Patient.findOne({ patientId: user.patientId });
  }
  if (!patient && user?.userId) {
    patient = await Patient.findOne({ patientId: user.userId });
  }
  if (!patient) {
    throw new Error("Patient profile not found");
  }

  const allowedFields = [
    "firstName",
    "lastName",
    "gender",
    "dateOfBirth",
    "phone",
    "email",
    "addressLine1",
    "addressLine2",
    "city",
    "state",
    "postalCode",
    "country",
    "emergencyContactName",
    "emergencyContactRelationship",
    "emergencyContactPhone",
    "insuranceProvider",
    "insuranceNumber",
    "bloodGroup",
    "allergies",
    "profilePhotoUrl"
  ];

  const payload = {};
  allowedFields.forEach((field) => {
    if (data[field] !== undefined) {
      payload[field] = data[field];
    }
  });

  if (payload.dateOfBirth) {
    payload.age = calculateAge(payload.dateOfBirth);
  }

  if (
    payload.addressLine1 !== undefined ||
    payload.addressLine2 !== undefined ||
    payload.city !== undefined ||
    payload.state !== undefined ||
    payload.postalCode !== undefined ||
    payload.country !== undefined
  ) {
    payload.address = [
      payload.addressLine1 ?? patient.addressLine1,
      payload.addressLine2 ?? patient.addressLine2,
      payload.city ?? patient.city,
      payload.state ?? patient.state,
      payload.postalCode ?? patient.postalCode,
      payload.country ?? patient.country
    ]
      .filter(Boolean)
      .join(", ");
  }

  const updated = await Patient.findByIdAndUpdate(patient._id, payload, { new: true });

  if (updated?.user) {
    const userUpdate = {};
    const mergedFirstName = payload.firstName ?? updated.firstName;
    const mergedLastName = payload.lastName ?? updated.lastName;
    if (mergedFirstName || mergedLastName) {
      userUpdate.name = `${mergedFirstName || ""} ${mergedLastName || ""}`.trim();
    }
    if (payload.email !== undefined) {
      userUpdate.email = payload.email ? String(payload.email).toLowerCase().trim() : undefined;
    }
    if (payload.phone !== undefined) {
      userUpdate.phone = payload.phone ? String(payload.phone).trim() : undefined;
    }
    if (Object.keys(userUpdate).length) {
      await User.findByIdAndUpdate(updated.user, userUpdate);
    }
  }

  updated.profilePhotoUrl = normalizePhotoPath(updated.profilePhotoUrl);
  return updated;
};

exports.updatePatientPhotoByUserId = async (userId, filePath) => {
  const user = await User.findById(userId).select("patientId userId");
  let patient = await Patient.findOne({ user: userId });
  if (!patient && user?.patientId) {
    patient = await Patient.findOne({ patientId: user.patientId });
  }
  if (!patient && user?.userId) {
    patient = await Patient.findOne({ patientId: user.userId });
  }
  if (!patient) {
    throw new Error("Patient profile not found");
  }
  patient.profilePhotoUrl = normalizePhotoPath(filePath || "");
  await patient.save();
  patient.profilePhotoUrl = normalizePhotoPath(patient.profilePhotoUrl);
  return patient;
};

exports.updatePatientMedicalHistory = async (patientRef, payload = {}, actorUser) => {
  const role = String(actorUser?.role || "").toUpperCase();
  if (![ROLES.NURSE, ROLES.ADMIN, ROLES.SUPER_ADMIN].includes(role)) {
    throw new Error("Access denied");
  }

  const patient =
    (await Patient.findOne({ patientId: patientRef })) ||
    (await Patient.findById(patientRef));

  if (!patient) {
    throw new Error("Patient not found");
  }

  const next = {};
  if (payload.allergies !== undefined) {
    next.allergies = Array.isArray(payload.allergies)
      ? payload.allergies
      : String(payload.allergies || "")
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);
  }
  if (payload.chronicConditions !== undefined) {
    next.chronicConditions = Array.isArray(payload.chronicConditions)
      ? payload.chronicConditions
      : String(payload.chronicConditions || "")
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);
  }
  if (payload.pastSurgeries !== undefined) next.pastSurgeries = payload.pastSurgeries;
  if (payload.currentMedications !== undefined) next.currentMedications = payload.currentMedications;
  if (payload.lifestyle !== undefined) next.lifestyle = payload.lifestyle;

  const updated = await Patient.findByIdAndUpdate(patient._id, next, { new: true });
  return updated;
};

exports.getPatientTimeline = async (patientRef) => {
  const patient =
    (await Patient.findOne({ patientId: patientRef })) ||
    (await Patient.findById(patientRef));

  if (!patient) {
    throw new Error("Patient not found");
  }

  const [sessions, vitals, painAssessments, painAssessments3D, alerts] = await Promise.all([
    Appointment.find({ patient: patient._id })
      .populate("physiotherapist", "userId physioId name role")
      .populate("physio", "userId physioId name role")
      .populate("assignedTo", "userId nurseId name role")
      .populate("nurse", "userId nurseId name role")
      .sort({ appointmentDate: -1 })
      .limit(100),
    Vitals.find({ patient: patient._id })
      .populate("recordedBy", "userId nurseId name role")
      .sort({ recordedAt: -1, createdAt: -1 })
      .limit(100),
    PainAssessment.find({ patient: patient._id, isActive: true })
      .populate("nurse", "userId nurseId name role")
      .sort({ createdAt: -1 })
      .limit(100),
    PainAssessment3D.find({ patientId: patient._id })
      .populate("createdBy", "userId nurseId physioId name role")
      .sort({ createdAt: -1 })
      .limit(200),
    Alert.find({ patient: patient._id, isResolved: false })
      .populate("createdBy", "userId nurseId name role")
      .sort({ createdAt: -1 })
      .limit(50)
  ]);

  const painHistory = [
    ...vitals
      .filter((row) => row.painScale !== undefined && row.painScale !== null)
      .map((row) => ({
        vitalsId: row._id,
        painScale: row.painScale,
        affectedArea: row.painAffectedArea || "",
        notes: row.painNotes || "",
        recordedAt: row.recordedAt || row.createdAt,
        recordedBy: row.recordedBy
      })),
    ...painAssessments.map((row) => ({
      assessmentId: row.assessmentId,
      painScale: row.painScore,
      affectedArea: row.bodyArea,
      painType: row.painType,
      notes: row.description,
      recordedAt: row.createdAt,
      recordedBy: row.nurse
    })),
    ...painAssessments3D.flatMap((row) =>
      (Array.isArray(row.painEntries) ? row.painEntries : []).map((entry) => ({
        assessmentId: row._id,
        painScale: entry.intensity,
        affectedArea: entry.bodyPart,
        painType: entry.type,
        notes: entry.notes,
        duration: entry.duration,
        recordedAt: entry.createdAt || row.createdAt,
        recordedBy: row.createdBy
      }))
    )
  ].sort((a, b) => new Date(b.recordedAt || 0).getTime() - new Date(a.recordedAt || 0).getTime());

  const computedAlerts = [];
  vitals.forEach((row) => {
    const bp = String(row.bloodPressure || "");
    const match = bp.match(/(\d+)\s*\/\s*(\d+)/);
    if (match) {
      const systolic = Number(match[1]);
      const diastolic = Number(match[2]);
      if (systolic >= 140 || diastolic >= 90) {
        computedAlerts.push({
          _id: `AUTO-BP-${row._id}`,
          type: "High BP",
          severity: systolic >= 160 || diastolic >= 100 ? "CRITICAL" : "HIGH",
          message: `High BP recorded (${systolic}/${diastolic})`,
          source: "AUTO",
          createdAt: row.recordedAt || row.createdAt
        });
      }
    }
    if (Number(row.painScale || 0) >= 8) {
      computedAlerts.push({
        _id: `AUTO-PAIN-${row._id}`,
        type: "Severe Pain",
        severity: Number(row.painScale) >= 9 ? "CRITICAL" : "HIGH",
        message: `Pain scale ${row.painScale}/10`,
        source: "AUTO",
        createdAt: row.recordedAt || row.createdAt
      });
    }
    if (row.swelling === true) {
      computedAlerts.push({
        _id: `AUTO-SWELL-${row._id}`,
        type: "Swelling Recurring",
        severity: "MEDIUM",
        message: "Swelling observed during intake",
        source: "AUTO",
        createdAt: row.recordedAt || row.createdAt
      });
    }
  });

  const missedSessions = sessions.filter((row) =>
    ["NO_SHOW", "CANCELLED"].includes(String(row.status || "").toUpperCase())
  ).length;
  if (missedSessions >= 2) {
    computedAlerts.push({
      _id: "AUTO-MISSED-SESSIONS",
      type: "Repeated Missed Sessions",
      severity: missedSessions >= 4 ? "HIGH" : "MEDIUM",
      message: `${missedSessions} missed/cancelled sessions recorded.`,
      source: "AUTO",
      createdAt: new Date()
    });
  }

  return {
    patient,
    sessions,
    vitals,
    painHistory,
    alerts: [...alerts, ...computedAlerts].sort(
      (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    )
  };
};
