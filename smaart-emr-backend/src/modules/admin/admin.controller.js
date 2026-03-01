
const mongoose = require("mongoose");
const Patient = require("../patient/patient.model");
const Appointment = require("../appointment/appointment.model");
const AppointmentRequest = require("../appointmentRequest/request.model");
const User = require("../user/user.model");
const Consultant = require("../consultant/consultant.model");
const Vitals = require("../nurse/vitals.model");
const PainAssessment3D = require("../pain/pain.model");
const Audit = require("../../shared/audit.model");
const Settings = require("./settings.model");
const patientService = require("../patient/patient.service");
const appointmentService = require("../appointment/appointment.service");
const appointmentRequestService = require("../appointmentRequest/request.service");
const userService = require("../user/user.service");
const consultantService = require("../consultant/consultant.service");
const { success, error } = require("../../utils/responseHandler");
const logAudit = require("../../utils/auditLogger");
const ROLES = require("../../config/roles");

const parsePagination = (req) => {
  const page = Math.max(Number(req.query.page || 1), 1);
  const limit = Math.min(Math.max(Number(req.query.limit || 10), 1), 100);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

const buildSort = (req, fallback = { createdAt: -1 }) => {
  const sortBy = req.query.sortBy;
  const sortOrder = String(req.query.sortOrder || "desc").toLowerCase() === "asc" ? 1 : -1;
  if (!sortBy) return fallback;
  return { [sortBy]: sortOrder };
};

const parseBoolean = (value) => {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value === "boolean") return value;
  const normalized = String(value).toLowerCase();
  if (["true", "1", "yes"].includes(normalized)) return true;
  if (["false", "0", "no"].includes(normalized)) return false;
  return undefined;
};

const normalizeStatus = (value) => String(value || "").toUpperCase();
const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(String(value || "").trim());

const resolveUserByIdentifier = async (identifier, roles) => {
  if (!identifier) return null;
  const lookup = [
    { userId: identifier },
    { nurseId: identifier },
    { physioId: identifier },
    { adminId: identifier }
  ];
  if (isValidObjectId(identifier)) {
    lookup.push({ _id: identifier });
  }
  const query = { $or: lookup };
  if (roles) {
    query.role = Array.isArray(roles) ? { $in: roles } : roles;
  }
  return User.findOne(query).select("-password");
};

const resolvePatientByIdentifier = async (identifier) => {
  if (!identifier) return null;
  if (isValidObjectId(identifier)) {
    const byId = await Patient.findById(identifier);
    if (byId) return byId;
  }
  return Patient.findOne({ patientId: identifier });
};

const resolveAppointmentByIdentifier = async (identifier) => {
  if (!identifier) return null;
  return Appointment.findOne({
    $or: [{ appointmentId: identifier }, { _id: identifier }]
  });
};

const logAdminAction = async (req, action, entityType, entityId, metadata) => {
  await logAudit({
    userId: req.user?._id,
    role: req.user?.role,
    action,
    entityType,
    entityId,
    metadata
  });
};

// ==================== PATIENTS ====================

exports.getPatients = async (req, res) => {
  try {
    const { search = "", assignedPhysio, todayVisit } = req.query;
    const status = String(req.query.status || "all").toLowerCase();
    const { page, limit, skip } = parsePagination(req);
    const sort = buildSort(req, { createdAt: -1 });

    const filters = {};
    if (status === "active") filters.isActive = true;
    if (status === "inactive") filters.isActive = false;
    if (search) filters.search = search;

    if (assignedPhysio) {
      const physio = await resolveUserByIdentifier(assignedPhysio, [
        ROLES.PHYSIO,
        ROLES.PHYSIOTHERAPIST,
        ROLES.CONSULTANT
      ]);
      if (physio) {
        filters.assignedPhysio = physio._id;
      }
    }

    if (todayVisit === "true") {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      const patientIds = await Appointment.distinct("patient", {
        appointmentDate: { $gte: start, $lt: end }
      });
      filters._id = { $in: patientIds.length ? patientIds : [null] };
    }

    const [patients, total] = await Promise.all([
      patientService.listPatientsPaged(filters, skip, limit, sort),
      patientService.countPatients(filters)
    ]);

    success(res, "Patients fetched", {
      items: patients,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (err) {
    error(res, err.message, 500);
  }
};

exports.getPatientDetail = async (req, res) => {
  try {
    const patient = await patientService.getPatientById(req.params.patientId);
    success(res, "Patient details retrieved", patient);
  } catch (err) {
    error(res, err.message, 404);
  }
};

exports.getPatientTimeline = async (req, res) => {
  try {
    const timeline = await patientService.getPatientTimeline(req.params.patientId);
    success(res, "Patient timeline retrieved", {
      ...timeline,
      posturalAnalysis: [],
      treatmentPlans: []
    });
  } catch (err) {
    error(res, err.message, 404);
  }
};

exports.createPatient = async (req, res) => {
  try {
    const created = await patientService.createPatient(req.body);
    await logAdminAction(req, "CREATE", "Patient", created.patient?._id || created.patientId, {
      patientId: created.patient?.patientId
    });
    success(res, "Patient created successfully", created, 201);
  } catch (err) {
    error(res, err.message, 400);
  }
};

exports.updatePatient = async (req, res) => {
  try {
    const patient = await patientService.updatePatient(req.params.patientId, req.body);
    await logAdminAction(req, "UPDATE", "Patient", patient._id);
    success(res, "Patient updated successfully", patient);
  } catch (err) {
    error(res, err.message, 400);
  }
};

exports.deletePatient = async (req, res) => {
  try {
    const patient = await patientService.updatePatient(req.params.patientId, { isActive: false });
    if (patient?.user) {
      await userService.updateUser(patient.user, { isActive: false });
    }
    await logAdminAction(req, "DEACTIVATE", "Patient", patient._id);
    success(res, "Patient deactivated successfully", patient);
  } catch (err) {
    error(res, err.message, 400);
  }
};

exports.activatePatient = async (req, res) => {
  try {
    const patient = await patientService.updatePatient(req.params.patientId, { isActive: true });
    if (patient?.user) {
      await userService.updateUser(patient.user, { isActive: true });
    }
    await logAdminAction(req, "ACTIVATE", "Patient", patient._id);
    success(res, "Patient activated successfully", patient);
  } catch (err) {
    error(res, err.message, 400);
  }
};

// ==================== APPOINTMENTS ====================

exports.getAppointments = async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req);
    const status = req.query.status && String(req.query.status).toUpperCase() !== "ALL" ? req.query.status : undefined;
    const isActive = parseBoolean(req.query.isActive);

    const query = {
      search: req.query.search,
      status,
      date: req.query.date,
      isActive: isActive !== undefined ? isActive : true,
      sortBy: req.query.sortBy,
      sortOrder: req.query.sortOrder,
      skip,
      limit
    };

    const [items, total] = await Promise.all([
      appointmentService.listAppointments(query, req.user),
      appointmentService.countAppointments(query, req.user)
    ]);

    success(res, "Appointments fetched", {
      items,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (err) {
    error(res, err.message, 500);
  }
};

exports.getAppointmentDetail = async (req, res) => {
  try {
    const appointment = await Appointment.findOne({
      $or: [{ appointmentId: req.params.appointmentId }, { _id: req.params.appointmentId }]
    })
      .populate({ path: "patient", select: "firstName lastName patientId phone" })
      .populate({ path: "assignedTo", select: "name nurseId userId role" })
      .populate({ path: "nurse", select: "name nurseId userId role" })
      .populate({ path: "physiotherapist", select: "name physioId userId role" })
      .populate({ path: "physio", select: "name physioId userId role" });
    if (!appointment) return error(res, "Appointment not found", 404);
    success(res, "Appointment details retrieved", appointment);
  } catch (err) {
    error(res, err.message, 500);
  }
};

exports.createAppointment = async (req, res) => {
  try {
    const payload = { ...req.body };
    if (payload.nurseId && !payload.assignedTo) {
      payload.assignedTo = payload.nurseId;
    }
    const appointment = await appointmentService.createAppointment(payload, req.user);
    await logAdminAction(req, "CREATE", "Appointment", appointment._id);
    success(res, "Appointment created successfully", appointment, 201);
  } catch (err) {
    error(res, err.message, 400);
  }
};

exports.updateAppointment = async (req, res) => {
  try {
    const payload = {};
    if (req.body.patientId) {
      const patient = await resolvePatientByIdentifier(req.body.patientId);
      if (!patient) return error(res, "Patient not found", 404);
      payload.patient = patient._id;
    }
    if (req.body.physiotherapistId) {
      const physio = await resolveUserByIdentifier(req.body.physiotherapistId, [
        ROLES.PHYSIO,
        ROLES.PHYSIOTHERAPIST,
        ROLES.CONSULTANT
      ]);
      if (!physio) return error(res, "Physio not found", 404);
      payload.physiotherapist = physio._id;
      payload.physio = physio._id;
    }
    if (req.body.nurseId || req.body.assignedTo) {
      const nurse = await resolveUserByIdentifier(req.body.nurseId || req.body.assignedTo, ROLES.NURSE);
      if (!nurse) return error(res, "Nurse not found", 404);
      payload.assignedTo = nurse._id;
      payload.nurse = nurse._id;
    }

    const allowedFields = [
      "appointmentDate",
      "timeSlot",
      "location",
      "appointmentType",
      "notes",
      "status",
      "isActive"
    ];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        if (field === "appointmentDate") {
          payload[field] = new Date(req.body[field]);
        } else if (field === "appointmentType") {
          payload[field] = String(req.body[field]).toUpperCase();
        } else if (field === "status") {
          payload[field] = normalizeStatus(req.body[field]);
        } else if (field === "isActive") {
          payload[field] = parseBoolean(req.body[field]);
        } else {
          payload[field] = req.body[field];
        }
      }
    });

    const appointment = await Appointment.findOneAndUpdate(
      { $or: [{ appointmentId: req.params.appointmentId }, { _id: req.params.appointmentId }] },
      payload,
      { new: true }
    )
      .populate("patient")
      .populate("physiotherapist", "userId physioId name role email phone")
      .populate("assignedTo", "userId nurseId name role email phone");

    if (!appointment) return error(res, "Appointment not found", 404);
    await logAdminAction(req, "UPDATE", "Appointment", appointment._id, payload);
    success(res, "Appointment updated successfully", appointment);
  } catch (err) {
    error(res, err.message, 400);
  }
};

exports.updateAppointmentStatus = async (req, res) => {
  try {
    const appointment = await appointmentService.updateAppointmentStatus(req.params.appointmentId, req.body.status);
    await logAdminAction(req, "UPDATE_STATUS", "Appointment", appointment._id, { status: appointment.status });
    success(res, "Appointment status updated", appointment);
  } catch (err) {
    error(res, err.message, 400);
  }
};

exports.reassignAppointment = async (req, res) => {
  try {
    const update = {};
    if (req.body.physiotherapistId) {
      const physio = await resolveUserByIdentifier(req.body.physiotherapistId, [
        ROLES.PHYSIO,
        ROLES.PHYSIOTHERAPIST,
        ROLES.CONSULTANT
      ]);
      if (!physio) return error(res, "Physio not found", 404);
      update.physiotherapist = physio._id;
      update.physio = physio._id;
    }
    if (req.body.nurseId) {
      const nurse = await resolveUserByIdentifier(req.body.nurseId, ROLES.NURSE);
      if (!nurse) return error(res, "Nurse not found", 404);
      update.assignedTo = nurse._id;
      update.nurse = nurse._id;
    }

    const appointment = await Appointment.findOneAndUpdate(
      { $or: [{ appointmentId: req.params.appointmentId }, { _id: req.params.appointmentId }] },
      update,
      { new: true }
    );
    if (!appointment) return error(res, "Appointment not found", 404);
    await logAdminAction(req, "REASSIGN", "Appointment", appointment._id, update);
    success(res, "Appointment reassigned successfully", appointment);
  } catch (err) {
    error(res, err.message, 400);
  }
};

exports.deleteAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findOneAndUpdate(
      { $or: [{ appointmentId: req.params.appointmentId }, { _id: req.params.appointmentId }] },
      { isActive: false },
      { new: true }
    );
    if (!appointment) return error(res, "Appointment not found", 404);
    await logAdminAction(req, "DEACTIVATE", "Appointment", appointment._id);
    success(res, "Appointment deactivated successfully", appointment);
  } catch (err) {
    error(res, err.message, 400);
  }
};

exports.activateAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findOneAndUpdate(
      { $or: [{ appointmentId: req.params.appointmentId }, { _id: req.params.appointmentId }] },
      { isActive: true },
      { new: true }
    );
    if (!appointment) return error(res, "Appointment not found", 404);
    await logAdminAction(req, "ACTIVATE", "Appointment", appointment._id);
    success(res, "Appointment activated successfully", appointment);
  } catch (err) {
    error(res, err.message, 400);
  }
};

// ==================== NURSES ====================

exports.getNurses = async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req);
    const status = String(req.query.status || "all").toLowerCase();
    const sort = buildSort(req, { createdAt: -1 });

    const filters = {
      role: ROLES.NURSE,
      search: req.query.search,
      isActive: status === "inactive" ? false : status === "active" ? true : undefined,
      skip,
      limit,
      sort
    };
    const [items, total] = await Promise.all([
      userService.listUsers(filters),
      userService.countUsers({ role: ROLES.NURSE, search: req.query.search, isActive: filters.isActive })
    ]);
    success(res, "Nurses fetched", {
      items,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (err) {
    error(res, err.message, 500);
  }
};

exports.getNurseDetail = async (req, res) => {
  try {
    const nurse = await resolveUserByIdentifier(req.params.nurseId, ROLES.NURSE);
    if (!nurse) return error(res, "Nurse not found", 404);

    const [vitalsCount, appointmentsCount, recentAppointments, activityLog] = await Promise.all([
      Vitals.countDocuments({ recordedBy: nurse._id }),
      Appointment.countDocuments({ assignedTo: nurse._id }),
      Appointment.find({ assignedTo: nurse._id })
        .populate("patient", "patientId firstName lastName")
        .sort({ appointmentDate: -1 })
        .limit(5),
      Audit.find({ performedBy: nurse._id })
        .sort({ createdAt: -1 })
        .limit(10)
    ]);

    success(res, "Nurse details retrieved", {
      ...nurse.toObject(),
      stats: {
        vitalsCount,
        appointmentsCount
      },
      recentAppointments,
      activityLog
    });
  } catch (err) {
    error(res, err.message, 500);
  }
};

exports.createNurse = async (req, res) => {
  try {
    const result = await userService.createStaff(req.body, ROLES.NURSE);
    await logAdminAction(req, "CREATE", "Nurse", null, { userId: result.userId });
    success(res, "Nurse created successfully", result, 201);
  } catch (err) {
    error(res, err.message, 400);
  }
};

exports.updateNurse = async (req, res) => {
  try {
    const nurse = await resolveUserByIdentifier(req.params.nurseId, ROLES.NURSE);
    if (!nurse) return error(res, "Nurse not found", 404);
    const updated = await userService.updateUser(nurse._id, req.body);
    await logAdminAction(req, "UPDATE", "Nurse", nurse._id);
    success(res, "Nurse updated successfully", updated);
  } catch (err) {
    error(res, err.message, 400);
  }
};

exports.deleteNurse = async (req, res) => {
  try {
    const nurse = await resolveUserByIdentifier(req.params.nurseId, ROLES.NURSE);
    if (!nurse) return error(res, "Nurse not found", 404);
    const updated = await userService.updateUser(nurse._id, { isActive: false });
    await logAdminAction(req, "DEACTIVATE", "Nurse", nurse._id);
    success(res, "Nurse deactivated successfully", updated);
  } catch (err) {
    error(res, err.message, 400);
  }
};

exports.activateNurse = async (req, res) => {
  try {
    const nurse = await resolveUserByIdentifier(req.params.nurseId, ROLES.NURSE);
    if (!nurse) return error(res, "Nurse not found", 404);
    const updated = await userService.updateUser(nurse._id, { isActive: true });
    await logAdminAction(req, "ACTIVATE", "Nurse", nurse._id);
    success(res, "Nurse activated successfully", updated);
  } catch (err) {
    error(res, err.message, 400);
  }
};

exports.resetNursePassword = async (req, res) => {
  try {
    const nurse = await resolveUserByIdentifier(req.params.nurseId, ROLES.NURSE);
    if (!nurse) return error(res, "Nurse not found", 404);
    const tempPassword = Math.random().toString(36).slice(-8);
    const updated = await userService.updateUser(nurse._id, {
      password: tempPassword,
      mustChangePassword: true
    });
    await logAdminAction(req, "RESET_PASSWORD", "Nurse", nurse._id);
    success(res, "Nurse password reset", { ...updated, tempPassword });
  } catch (err) {
    error(res, err.message, 400);
  }
};

// ==================== PHYSIOS ====================

exports.getPhysios = async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req);
    const search = req.query.search;
    const status = String(req.query.status || "all").toLowerCase();
    const statusFilter = status === "inactive" ? false : status === "active" ? true : undefined;

    const baseQuery = {
      role: { $in: [ROLES.PHYSIO, ROLES.PHYSIOTHERAPIST, ROLES.CONSULTANT] }
    };
    if (statusFilter !== undefined) baseQuery.isActive = statusFilter;
    if (search) {
      const q = String(search).trim();
      baseQuery.$or = [
        { name: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
        { userId: { $regex: q, $options: "i" } },
        { physioId: { $regex: q, $options: "i" } }
      ];
    }

    const users = await User.find(baseQuery)
      .select("-password")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean();

    const total = await User.countDocuments(baseQuery);
    const profiles = await Consultant.find({ user: { $in: users.map((u) => u._id) } }).lean();
    const profileMap = new Map(profiles.map((p) => [String(p.user), p]));

    const items = users.map((user) => {
      const profile = profileMap.get(String(user._id));
      return {
        ...user,
        specialization: profile?.specialization || "Physiotherapy",
        experienceYears: profile?.experienceYears || 0,
        consultationFee: profile?.consultationFee || 0,
        availability: profile?.availability || []
      };
    });

    success(res, "Physios fetched", {
      items,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (err) {
    error(res, err.message, 500);
  }
};

exports.getPhysioDetail = async (req, res) => {
  try {
    const user = await resolveUserByIdentifier(req.params.physioId, [
      ROLES.PHYSIO,
      ROLES.PHYSIOTHERAPIST,
      ROLES.CONSULTANT
    ]);
    if (!user) return error(res, "Physio not found", 404);
    const profile = await Consultant.findOne({ user: user._id });

    const [activePatients, totalAppointments, treatmentPlans] = await Promise.all([
      Appointment.distinct("patient", { physiotherapist: user._id }).then((rows) => rows.length),
      Appointment.countDocuments({ physiotherapist: user._id }),
      Appointment.countDocuments({
        physiotherapist: user._id,
        "consultation.diagnosis": { $exists: true, $ne: "" }
      })
    ]);

    success(res, "Physio details retrieved", {
      ...user.toObject(),
      specialization: profile?.specialization || "Physiotherapy",
      experienceYears: profile?.experienceYears || 0,
      consultationFee: profile?.consultationFee || 0,
      availability: profile?.availability || [],
      stats: {
        activePatients,
        totalAppointments,
        treatmentPlansCreated: treatmentPlans,
        posturalAssessmentsDone: 0
      }
    });
  } catch (err) {
    error(res, err.message, 500);
  }
};

exports.createPhysio = async (req, res) => {
  try {
    const role = req.body.role || ROLES.PHYSIO;
    const result = await userService.createStaff(req.body, role);
    await logAdminAction(req, "CREATE", "Physio", null, { userId: result.userId });
    success(res, "Physio created successfully", result, 201);
  } catch (err) {
    error(res, err.message, 400);
  }
};

exports.updatePhysio = async (req, res) => {
  try {
    const user = await resolveUserByIdentifier(req.params.physioId, [
      ROLES.PHYSIO,
      ROLES.PHYSIOTHERAPIST,
      ROLES.CONSULTANT
    ]);
    if (!user) return error(res, "Physio not found", 404);
    const updatedUser = await userService.updateUser(user._id, req.body);
    await Consultant.findOneAndUpdate(
      { user: user._id },
      {
        specialization: req.body.specialization,
        qualification: req.body.qualification,
        experienceYears: req.body.experienceYears,
        consultationFee: req.body.consultationFee,
        availability: req.body.availability
      },
      { new: true }
    );
    await logAdminAction(req, "UPDATE", "Physio", user._id);
    success(res, "Physio updated successfully", updatedUser);
  } catch (err) {
    error(res, err.message, 400);
  }
};

exports.deletePhysio = async (req, res) => {
  try {
    const user = await resolveUserByIdentifier(req.params.physioId, [
      ROLES.PHYSIO,
      ROLES.PHYSIOTHERAPIST,
      ROLES.CONSULTANT
    ]);
    if (!user) return error(res, "Physio not found", 404);
    const updated = await userService.updateUser(user._id, { isActive: false });
    await Consultant.findOneAndUpdate({ user: user._id }, { isActive: false });
    await logAdminAction(req, "DEACTIVATE", "Physio", user._id);
    success(res, "Physio deactivated successfully", updated);
  } catch (err) {
    error(res, err.message, 400);
  }
};

exports.activatePhysio = async (req, res) => {
  try {
    const user = await resolveUserByIdentifier(req.params.physioId, [
      ROLES.PHYSIO,
      ROLES.PHYSIOTHERAPIST,
      ROLES.CONSULTANT
    ]);
    if (!user) return error(res, "Physio not found", 404);
    const updated = await userService.updateUser(user._id, { isActive: true });
    await Consultant.findOneAndUpdate({ user: user._id }, { isActive: true });
    await logAdminAction(req, "ACTIVATE", "Physio", user._id);
    success(res, "Physio activated successfully", updated);
  } catch (err) {
    error(res, err.message, 400);
  }
};

exports.resetPhysioPassword = async (req, res) => {
  try {
    const user = await resolveUserByIdentifier(req.params.physioId, [
      ROLES.PHYSIO,
      ROLES.PHYSIOTHERAPIST,
      ROLES.CONSULTANT
    ]);
    if (!user) return error(res, "Physio not found", 404);
    const tempPassword = Math.random().toString(36).slice(-8);
    const updated = await userService.updateUser(user._id, {
      password: tempPassword,
      mustChangePassword: true
    });
    await logAdminAction(req, "RESET_PASSWORD", "Physio", user._id);
    success(res, "Physio password reset", { ...updated, tempPassword });
  } catch (err) {
    error(res, err.message, 400);
  }
};

// ==================== REQUESTS ====================

exports.getAppointmentRequests = async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req);
    const status = req.query.status ? String(req.query.status).toUpperCase() : undefined;
    const statusAsActive = status === "ACTIVE" ? true : status === "INACTIVE" ? false : undefined;

    const filters = {
      status: statusAsActive === undefined ? status : undefined,
      search: req.query.search,
      isActive: statusAsActive !== undefined ? statusAsActive : parseBoolean(req.query.isActive)
    };

    const [items, total] = await Promise.all([
      appointmentRequestService.listRequests(filters, skip, limit),
      appointmentRequestService.countRequests(filters)
    ]);

    success(res, "Appointment requests fetched", {
      items,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (err) {
    error(res, err.message, 500);
  }
};

exports.getRequestDetail = async (req, res) => {
  try {
    const request = await appointmentRequestService.getRequestById(req.params.requestId);
    if (!request) return error(res, "Request not found", 404);
    success(res, "Request details retrieved", request);
  } catch (err) {
    error(res, err.message, 500);
  }
};

exports.updateRequest = async (req, res) => {
  try {
    const request = await appointmentRequestService.updateRequest(req.params.requestId, req.body);
    if (!request) return error(res, "Request not found", 404);
    await logAdminAction(req, "UPDATE", "AppointmentRequest", request._id);
    success(res, "Request updated successfully", request);
  } catch (err) {
    error(res, err.message, 400);
  }
};

exports.approveRequest = async (req, res) => {
  try {
    const payload = { ...req.body };
    if (payload.nurseId && !payload.assignedTo) {
      payload.assignedTo = payload.nurseId;
    }
    const result = await appointmentRequestService.convertRequestToPatientAndAppointment(
      req.params.requestId,
      payload,
      req.user
    );
    await logAdminAction(req, "APPROVE", "AppointmentRequest", result.request._id);
    success(res, "Request approved and appointment created", result);
  } catch (err) {
    error(res, err.message, 400);
  }
};

exports.rejectRequest = async (req, res) => {
  try {
    const request = await appointmentRequestService.updateRequest(req.params.requestId, {
      status: "REJECTED"
    });
    if (!request) return error(res, "Request not found", 404);
    await logAdminAction(req, "REJECT", "AppointmentRequest", request._id);
    success(res, "Request rejected successfully", request);
  } catch (err) {
    error(res, err.message, 400);
  }
};

exports.deleteRequest = async (req, res) => {
  try {
    const request = await appointmentRequestService.updateRequest(req.params.requestId, {
      isActive: false
    });
    if (!request) return error(res, "Request not found", 404);
    await logAdminAction(req, "DEACTIVATE", "AppointmentRequest", request._id);
    success(res, "Request deactivated successfully", request);
  } catch (err) {
    error(res, err.message, 400);
  }
};

exports.activateRequest = async (req, res) => {
  try {
    const request = await appointmentRequestService.updateRequest(req.params.requestId, {
      isActive: true
    });
    if (!request) return error(res, "Request not found", 404);
    await logAdminAction(req, "ACTIVATE", "AppointmentRequest", request._id);
    success(res, "Request activated successfully", request);
  } catch (err) {
    error(res, err.message, 400);
  }
};

// ==================== DASHBOARD ====================

exports.getDashboardStats = async (req, res) => {
  try {
    const [totalPatients, activePatients, totalNurses, totalPhysios] = await Promise.all([
      patientService.countPatients({}),
      patientService.countPatients({ isActive: true }),
      userService.countUsers({ role: ROLES.NURSE, isActive: true }),
      consultantService.countConsultants({ isActive: true })
    ]);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    const todayAppointments = await Appointment.countDocuments({
      appointmentDate: { $gte: todayStart, $lt: todayEnd },
      isActive: true
    });

    const pendingRequests = await AppointmentRequest.countDocuments({
      status: "PENDING",
      isActive: true
    });

    const upcomingAppointments = await Appointment.find({
      appointmentDate: { $gte: new Date() },
      isActive: true
    })
      .populate("patient", "patientId firstName lastName")
      .populate("physiotherapist", "userId physioId name")
      .sort({ appointmentDate: 1 })
      .limit(6);

    const recentUsers = await User.find({ isActive: true })
      .select("userId name role createdAt")
      .sort({ createdAt: -1 })
      .limit(6);

    success(res, "Dashboard stats retrieved", {
      totalPatients,
      activePatients,
      totalNurses,
      totalPhysios,
      todayAppointments,
      pendingRequests,
      upcomingAppointments,
      recentUsers
    });
  } catch (err) {
    error(res, err.message, 500);
  }
};

exports.getActivityLog = async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req);
    const query = {};
    if (req.query.action) query.action = normalizeStatus(req.query.action);
    if (req.query.entityType) query.entityType = req.query.entityType;
    if (req.query.userId) query.performedBy = req.query.userId;

    const [items, total] = await Promise.all([
      Audit.find(query)
        .populate("performedBy", "name userId nurseId physioId role")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Audit.countDocuments(query)
    ]);

    success(res, "Activity log retrieved", {
      items,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (err) {
    error(res, err.message, 500);
  }
};

// ==================== REPORTS ====================

exports.getPatientGrowth = async (req, res) => {
  try {
    const since = new Date();
    since.setMonth(since.getMonth() - 11);
    since.setDate(1);
    since.setHours(0, 0, 0, 0);

    const data = await Patient.aggregate([
      { $match: { createdAt: { $gte: since } } },
      {
        $group: {
          _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    const labels = [];
    const values = [];
    for (let i = 0; i < 12; i += 1) {
      const date = new Date(since);
      date.setMonth(date.getMonth() + i);
      const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
      const entry = data.find((d) => `${d._id.year}-${d._id.month}` === key);
      labels.push(date.toLocaleString("default", { month: "short" }));
      values.push(entry ? entry.count : 0);
    }

    success(res, "Patient growth retrieved", {
      labels,
      datasets: [
        {
          label: "New Patients",
          data: values,
          borderColor: "#0891b2",
          backgroundColor: "rgba(8, 145, 178, 0.1)",
          tension: 0.4
        }
      ]
    });
  } catch (err) {
    error(res, err.message, 500);
  }
};

exports.getAppointmentsTrends = async (req, res) => {
  try {
    const data = await Appointment.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    const labels = data.map((d) => d._id);
    const values = data.map((d) => d.count);

    success(res, "Appointments trends retrieved", {
      labels,
      datasets: [
        {
          label: "Appointments",
          data: values,
          backgroundColor: ["#0891b2", "#10b981", "#ef4444", "#f59e0b", "#6366f1", "#7c3aed"]
        }
      ]
    });
  } catch (err) {
    error(res, err.message, 500);
  }
};

exports.getPhysioWorkload = async (req, res) => {
  try {
    const data = await Appointment.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: "$physiotherapist", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    const physios = await User.find({ _id: { $in: data.map((d) => d._id) } }).select("name userId physioId");
    const map = new Map(physios.map((p) => [String(p._id), p]));

    success(res, "Physio workload retrieved", {
      labels: data.map((d) => map.get(String(d._id))?.name || "Physio"),
      datasets: [{ label: "Appointments", data: data.map((d) => d.count), backgroundColor: "#0891b2" }]
    });
  } catch (err) {
    error(res, err.message, 500);
  }
};

exports.getPainAreas = async (req, res) => {
  try {
    const painAgg = await PainAssessment3D.aggregate([
      { $unwind: "$painEntries" },
      { $group: { _id: "$painEntries.bodyPart", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 6 }
    ]);

    success(res, "Pain areas retrieved", {
      labels: painAgg.map((row) => row._id),
      datasets: [
        {
          data: painAgg.map((row) => row.count),
          backgroundColor: ["#0891b2", "#06b6d4", "#20c997", "#2dd4bf", "#7dd3fc", "#38bdf8"]
        }
      ]
    });
  } catch (err) {
    error(res, err.message, 500);
  }
};

exports.getTreatmentCompletion = async (req, res) => {
  try {
    const total = await Appointment.countDocuments({ isActive: true });
    const completed = await Appointment.countDocuments({ status: "COMPLETED", isActive: true });
    const cancelled = await Appointment.countDocuments({ status: "CANCELLED", isActive: true });
    const pending = Math.max(total - completed - cancelled, 0);
    success(res, "Treatment completion retrieved", {
      completed,
      pending,
      cancelled
    });
  } catch (err) {
    error(res, err.message, 500);
  }
};

// ==================== SETTINGS ====================

exports.getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }
    success(res, "Settings retrieved", settings);
  } catch (err) {
    error(res, err.message, 500);
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const updated = await Settings.findOneAndUpdate({}, req.body, {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true
    });
    await logAdminAction(req, "UPDATE", "Settings", updated._id, req.body);
    success(res, "Settings updated successfully", updated);
  } catch (err) {
    error(res, err.message, 400);
  }
};

exports.updateRolePermissions = async (req, res) => {
  try {
    const updated = await Settings.findOneAndUpdate(
      {},
      { rolePermissions: req.body },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    await logAdminAction(req, "UPDATE", "RolePermissions", updated._id, req.body);
    success(res, "Role permissions updated successfully", updated);
  } catch (err) {
    error(res, err.message, 400);
  }
};
