const Patient = require("./patient.model");
const generateRoleId = require("../../utils/generateId");
const ROLES = require("../../config/roles");
const User = require("../user/user.model");
const generateTempPassword = require("../../utils/tempPassword");

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

      const patient = await Patient.create({
        patientId,
        user: createdUser._id,
        firstName: data.firstName || fallback.firstName,
        lastName: data.lastName || fallback.lastName,
        gender: data.gender || "Other",
        dateOfBirth: data.dateOfBirth || new Date("2000-01-01"),
        phone: normalizedPhone,
        email: normalizedEmail || undefined,
        address: data.address,
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

  return patient;
};

exports.searchPatients = async (query = "") => {
  const q = String(query).trim();

  if (!q) {
    return Patient.find().sort({ createdAt: -1 }).limit(50);
  }

  return Patient.find({
    $or: [
      { patientId: q },
      { phone: q },
      { email: q },
      { firstName: { $regex: q, $options: "i" } },
      { lastName: { $regex: q, $options: "i" } }
    ]
  }).limit(50);
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

  return Patient.find(query).sort({ createdAt: -1 }).limit(100);
};

exports.updatePatient = async (patientId, data) => {
  const patient = await Patient.findOneAndUpdate(
    {
      $or: [{ patientId }, { _id: patientId }]
    },
    data,
    { new: true }
  );

  if (!patient) {
    throw new Error("Patient not found");
  }

  return patient;
};
