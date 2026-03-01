const generateUniqueId = require("../../utils/generateUniqueId");
const generateRoleId = require("../../utils/generateId");
const generateTempPassword = require("../../utils/tempPassword");
const User = require("./user.model");
const ROLES = require("../../config/roles");
const Consultant = require("../consultant/consultant.model");
const Audit = require("../../shared/audit.model");

const CONSULTANT_ROLES = [ROLES.CONSULTANT, ROLES.PHYSIO, ROLES.PHYSIOTHERAPIST];

const formatDuplicateError = (err) => {
  if (!err?.code || err.code !== 11000) return null;
  const key = Object.keys(err.keyPattern || {})[0] || "field";
  return `Duplicate ${key}. Please use a different ${key}.`;
};

const ensureUniqueContact = async ({ email, phone }) => {
  if (!email && !phone) return;
  const query = [];
  if (email) query.push({ email: String(email).toLowerCase().trim() });
  if (phone) query.push({ phone: String(phone).trim() });
  const existing = query.length ? await User.findOne({ $or: query }).select("email phone") : null;
  if (existing) {
    if (email && existing.email === String(email).toLowerCase().trim()) {
      throw new Error("Duplicate email. Please use a different email.");
    }
    if (phone && existing.phone === String(phone).trim()) {
      throw new Error("Duplicate phone. Please use a different phone.");
    }
  }
};

const generateStaffIds = async (role) => {
  if (role === ROLES.ADMIN || role === ROLES.SUPER_ADMIN) {
    const adminId = await generateUniqueId(ROLES.ADMIN);
    return { adminId, userId: adminId };
  }

  if (role === ROLES.NURSE) {
    const nurseId = await generateRoleId(ROLES.NURSE);
    return { nurseId, userId: nurseId };
  }

  if (CONSULTANT_ROLES.includes(role)) {
    const physioId = await generateRoleId(ROLES.PHYSIO);
    return { physioId, userId: physioId };
  }

  const userId = await generateUniqueId(role);
  return { userId };
};

exports.createStaff = async (data, role) => {
  if (!data?.name || !data?.email || !data?.phone) {
    throw new Error("name, email and phone are required");
  }

  await ensureUniqueContact({ email: data.email, phone: data.phone });

  const tempPassword = generateTempPassword();
  let lastErr = null;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const ids = await generateStaffIds(role);

      const user = await User.create({
        adminId: ids.adminId,
        userId: ids.userId,
        nurseId: ids.nurseId,
        physioId: ids.physioId,
        name: String(data.name).trim(),
        email: String(data.email).toLowerCase().trim(),
        phone: String(data.phone).trim(),
        password: tempPassword,
        role,
        mustChangePassword: true,
        isActive: true
      });

      if (CONSULTANT_ROLES.includes(role)) {
        await Consultant.findOneAndUpdate(
          { user: user._id },
          {
            physioId: user.physioId,
            user: user._id,
            specialization: data.specialization || "Physiotherapy",
            qualification: data.qualification || "",
            experienceYears: data.experienceYears || 0,
            consultationFee: data.consultationFee || 0,
            availability: Array.isArray(data.availability) ? data.availability : []
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      }

      return {
        adminId: user.adminId,
        userId: user.userId,
        nurseId: user.nurseId,
        physioId: user.physioId,
        temporaryPassword: tempPassword,
        tempPassword
      };
    } catch (err) {
      const duplicateMessage = formatDuplicateError(err);
      if (!duplicateMessage) {
        throw err;
      }
      lastErr = err;
      if (!/adminId|userId|nurseId|physioId/.test(duplicateMessage)) {
        throw new Error(duplicateMessage);
      }
    }
  }

  throw new Error(lastErr ? "Unable to generate unique ID. Please retry." : "Unable to create staff.");
};

exports.listStaff = async () => {
  return User.find({
    role: { $in: [ROLES.NURSE, ...CONSULTANT_ROLES] }
  })
    .select("-password")
    .sort({ createdAt: -1 });
};

exports.listUsers = async (filters = {}) => {
  const query = {};
  if (filters.role) {
    query.role = String(filters.role).toUpperCase();
  }
  if (filters.isActive !== undefined) {
    query.isActive = filters.isActive;
  }
  if (filters.search) {
    const q = String(filters.search).trim();
    query.$or = [
      { name: { $regex: q, $options: "i" } },
      { email: { $regex: q, $options: "i" } },
      { phone: { $regex: q, $options: "i" } },
      { userId: { $regex: q, $options: "i" } },
      { nurseId: { $regex: q, $options: "i" } },
      { physioId: { $regex: q, $options: "i" } }
    ];
  }

  const skip = Number(filters.skip || 0);
  const limit = Number(filters.limit || 50);
  const sort = filters.sort || { createdAt: -1 };

  return User.find(query)
    .select("-password")
    .sort(sort)
    .skip(skip)
    .limit(limit);
};

exports.countUsers = async (filters = {}) => {
  const query = {};
  if (filters.role) {
    query.role = String(filters.role).toUpperCase();
  }
  if (filters.isActive !== undefined) {
    query.isActive = filters.isActive;
  }
  if (filters.search) {
    const q = String(filters.search).trim();
    query.$or = [
      { name: { $regex: q, $options: "i" } },
      { email: { $regex: q, $options: "i" } },
      { phone: { $regex: q, $options: "i" } },
      { userId: { $regex: q, $options: "i" } },
      { nurseId: { $regex: q, $options: "i" } },
      { physioId: { $regex: q, $options: "i" } }
    ];
  }
  return User.countDocuments(query);
};

exports.getUserById = async (id) => {
  return User.findById(id).select("-password");
};

exports.updateUser = async (id, payload = {}) => {
  const user = await User.findById(id);
  if (!user) {
    throw new Error("User not found");
  }

  const updatable = [
    "name",
    "email",
    "phone",
    "password",
    "isActive",
    "mustChangePassword"
  ];
  updatable.forEach((field) => {
    if (payload[field] !== undefined) {
      user[field] = payload[field];
    }
  });

  await user.save();
  const safe = user.toObject();
  delete safe.password;
  return safe;
};

exports.createUser = async (data) => {
  const role = String(data.role || "").toUpperCase();
  if (!Object.values(ROLES).includes(role)) {
    throw new Error("Invalid role");
  }

  if ([ROLES.NURSE, ...CONSULTANT_ROLES].includes(role)) {
    return exports.createStaff(data, role);
  }

  if (!data?.name || !data?.email || !data?.phone) {
    throw new Error("name, email and phone are required");
  }

  await ensureUniqueContact({ email: data.email, phone: data.phone });

  const ids = await generateStaffIds(role);
  const tempPassword = generateTempPassword();

  const user = await User.create({
    adminId: ids.adminId,
    userId: ids.userId,
    patientId: ids.patientId,
    name: String(data.name).trim(),
    email: String(data.email).toLowerCase().trim(),
    phone: String(data.phone).trim(),
    password: tempPassword,
    role,
    mustChangePassword: true,
    isActive: true
  });

  return {
    adminId: user.adminId,
    userId: user.userId,
    patientId: user.patientId,
    temporaryPassword: tempPassword,
    tempPassword
  };
};

exports.getStaffAttendanceToday = async () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const logs = await Audit.find({
    role: { $in: [ROLES.NURSE, ROLES.CONSULTANT, ROLES.PHYSIO, ROLES.PHYSIOTHERAPIST] },
    $or: [
      { loginTime: { $gte: start, $lt: end } },
      { logoutTime: { $gte: start, $lt: end } },
      { createdAt: { $gte: start, $lt: end } }
    ]
  })
    .populate("performedBy", "name email nurseId physioId userId role")
    .sort({ createdAt: -1 })
    .lean();

  const attendanceMap = new Map();

  logs.forEach((log) => {
    const user = log.performedBy;
    if (!user?._id) return;
    const key = String(user._id);

    if (!attendanceMap.has(key)) {
      attendanceMap.set(key, {
        userId: user.userId,
        nurseId: user.nurseId,
        physioId: user.physioId,
        name: user.name,
        email: user.email,
        role: user.role,
        loginTime: null,
        logoutTime: null
      });
    }

    const row = attendanceMap.get(key);
    if (log.action === "LOGIN" && log.loginTime) {
      if (!row.loginTime || new Date(log.loginTime) > new Date(row.loginTime)) {
        row.loginTime = log.loginTime;
      }
    }
    if (log.action === "LOGOUT" && log.logoutTime) {
      if (!row.logoutTime || new Date(log.logoutTime) > new Date(row.logoutTime)) {
        row.logoutTime = log.logoutTime;
      }
    }
  });

  return Array.from(attendanceMap.values()).sort((a, b) => String(a.role).localeCompare(String(b.role)));
};
