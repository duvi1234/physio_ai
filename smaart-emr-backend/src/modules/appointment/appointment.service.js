const Appointment = require("./appointment.model");
const Patient = require("../patient/patient.model");
const User = require("../user/user.model");
const mongoose = require("mongoose");
const generateRoleId = require("../../utils/generateId");
const ROLES = require("../../config/roles");
const notificationService = require("../notification/notification.service");

const normalizeStatus = (status) => String(status || "").toUpperCase();
const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(String(value || "").trim());

const isNurseAccessible = (appointment, userId) => {
  if (!appointment) return false;
  return (
    String(appointment.assignedTo || "") === String(userId) ||
    String(appointment.nurse || "") === String(userId)
  );
};

const populateAppointment = (query) =>
  query
    .populate({ path: "patient", select: "firstName lastName patientId phone" })
    .populate({ path: "assignedTo", select: "name nurseId userId role" })
    .populate({ path: "nurse", select: "name nurseId userId role" })
    .populate({ path: "physiotherapist", select: "name physioId userId role" })
    .populate({ path: "physio", select: "name physioId userId role" });

const applyPatientFilter = async (filter, patientRef) => {
  if (!patientRef) return;
  const patient =
    (await Patient.findOne({ patientId: patientRef })) ||
    (isValidObjectId(patientRef) ? await Patient.findById(patientRef) : null);
  if (!patient) {
    throw new Error("Patient not found");
  }
  filter.patient = patient._id;
};

const applyRoleFilter = (filter, roleFilter) => {
  if (!roleFilter || typeof roleFilter !== "object") return;
  const keys = Object.keys(roleFilter || {});
  if (!keys.length) return;
  if (filter.$and) {
    filter.$and.push(roleFilter);
  } else {
    filter.$and = [roleFilter];
  }
};

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

  const physioLookup = [{ userId: data.physiotherapistId }, { physioId: data.physiotherapistId }];
  if (isValidObjectId(data.physiotherapistId)) {
    physioLookup.push({ _id: data.physiotherapistId });
  }

  const physio = await User.findOne({
    $or: physioLookup,
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

  const appointmentId = await generateRoleId("APPOINTMENT");
  let assignedTo = null;
  if (data.assignedTo) {
    const nurseLookup = [{ userId: data.assignedTo }, { nurseId: data.assignedTo }];
    if (isValidObjectId(data.assignedTo)) {
      nurseLookup.push({ _id: data.assignedTo });
    }

    const assignedNurse = await User.findOne({
      $or: nurseLookup,
      role: ROLES.NURSE
    }).select("_id");
    assignedTo = assignedNurse?._id || null;
  }

  const appointment = await Appointment.create({
    appointmentId,
    patient: patient._id,
    physiotherapist: physio._id,
    physio: physio._id,
    bookedBy: bookedByUser._id,
    assignedTo,
    nurse: assignedTo || null,
    appointmentDate: new Date(data.appointmentDate),
    timeSlot: data.timeSlot,
    location: data.location,
    appointmentType: data.appointmentType || "WALK_IN",
    notes: data.notes || "",
    status: "CONFIRMED"
  });

  if (patient.assignedPhysio?.toString() !== physio._id.toString()) {
    patient.assignedPhysio = physio._id;
    await patient.save();
  }

  await notificationService.sendAppointmentConfirmation({ patient, appointment, consultant: physio });

  return appointment;
};

exports.getAppointmentsForUser = async (user) => {
  if ([ROLES.ADMIN, ROLES.SUPER_ADMIN].includes(user.role)) {
    return populateAppointment(Appointment.find({ isActive: true })).sort({ appointmentDate: -1 });
  }

  if ([ROLES.CONSULTANT, ROLES.PHYSIO, ROLES.PHYSIOTHERAPIST].includes(user.role)) {
    return populateAppointment(
      Appointment.find({
        $or: [{ physiotherapist: user._id }, { physio: user._id }],
        isActive: true
      })
    )
      .sort({ appointmentDate: 1 });
  }

  if (user.role === ROLES.NURSE) {
    return populateAppointment(
      Appointment.find({
        $or: [{ assignedTo: user._id }, { nurse: user._id }],
        isActive: true
      })
    ).sort({ appointmentDate: 1 });
  }

  if (user.role === ROLES.PATIENT) {
    const patient = await Patient.findOne({ user: user._id });
    if (!patient) {
      return [];
    }

    return populateAppointment(
      Appointment.find({ patient: patient._id, isActive: true })
    ).sort({ appointmentDate: 1 });
  }

  return [];
};

exports.listAppointments = async (query = {}, user) => {
  const filter = {};

  if (query.isActive !== undefined) {
    filter.isActive = query.isActive === "false" ? false : Boolean(query.isActive);
  } else {
    filter.isActive = true;
  }

  if (query.status) {
    filter.status = normalizeStatus(query.status);
  }

  if (query.patientId) {
    await applyPatientFilter(filter, query.patientId);
  }
  if (query.roleFilter) {
    applyRoleFilter(filter, query.roleFilter);
  }

  if (query.appointmentDate || query.date) {
    const raw = query.appointmentDate || query.date;
    const startDate = new Date(raw);
    if (!Number.isNaN(startDate.getTime())) {
      const endDate = new Date(startDate);
      endDate.setHours(23, 59, 59, 999);
      startDate.setHours(0, 0, 0, 0);
      filter.appointmentDate = { $gte: startDate, $lte: endDate };
    }
  }

  if (query.search) {
    const q = String(query.search).trim();
    if (q) {
      const patientMatches = await Patient.find({
        $or: [
          { patientId: { $regex: q, $options: "i" } },
          { firstName: { $regex: q, $options: "i" } },
          { lastName: { $regex: q, $options: "i" } },
          { phone: { $regex: q, $options: "i" } }
        ]
      }).select("_id");
      const patientIds = patientMatches.map((p) => p._id);
      filter.$or = [
        { appointmentId: { $regex: q, $options: "i" } },
        ...(patientIds.length ? [{ patient: { $in: patientIds } }] : [])
      ];
    }
  }

  if (!query.roleFilter) {
    const role = String(user?.role || "").toUpperCase();
    if (role === ROLES.NURSE) {
      filter.$and = [...(filter.$and || []), { $or: [{ assignedTo: user._id }, { nurse: user._id }] }];
    }
    if ([ROLES.CONSULTANT, ROLES.PHYSIO, ROLES.PHYSIOTHERAPIST].includes(role)) {
      filter.$and = [...(filter.$and || []), { $or: [{ physiotherapist: user._id }, { physio: user._id }] }];
    }
    if (role === ROLES.PATIENT) {
      const patient = await Patient.findOne({ user: user._id }).select("_id");
      if (patient) {
        filter.patient = patient._id;
      } else {
        return [];
      }
    }
  }

  const sort = {};
  if (query.sortBy) {
    sort[query.sortBy] = String(query.sortOrder || "desc").toLowerCase() === "asc" ? 1 : -1;
  } else {
    sort.appointmentDate = -1;
  }

  const skip = Number(query.skip || 0);
  const limit = Number(query.limit || 50);

  return populateAppointment(
    Appointment.find(filter).sort(sort).skip(skip).limit(limit)
  );
};

exports.countAppointments = async (query = {}, user) => {
  const filter = {};
  if (query.isActive !== undefined) {
    filter.isActive = query.isActive === "false" ? false : Boolean(query.isActive);
  } else {
    filter.isActive = true;
  }
  if (query.status) {
    filter.status = normalizeStatus(query.status);
  }
  if (query.patientId) {
    await applyPatientFilter(filter, query.patientId);
  }
  if (query.roleFilter) {
    applyRoleFilter(filter, query.roleFilter);
  }
  if (query.appointmentDate || query.date) {
    const raw = query.appointmentDate || query.date;
    const startDate = new Date(raw);
    if (!Number.isNaN(startDate.getTime())) {
      const endDate = new Date(startDate);
      endDate.setHours(23, 59, 59, 999);
      startDate.setHours(0, 0, 0, 0);
      filter.appointmentDate = { $gte: startDate, $lte: endDate };
    }
  }
  if (query.search) {
    const q = String(query.search).trim();
    if (q) {
      const patientMatches = await Patient.find({
        $or: [
          { patientId: { $regex: q, $options: "i" } },
          { firstName: { $regex: q, $options: "i" } },
          { lastName: { $regex: q, $options: "i" } },
          { phone: { $regex: q, $options: "i" } }
        ]
      }).select("_id");
      const patientIds = patientMatches.map((p) => p._id);
      filter.$or = [
        { appointmentId: { $regex: q, $options: "i" } },
        ...(patientIds.length ? [{ patient: { $in: patientIds } }] : [])
      ];
    }
  }
  if (!query.roleFilter) {
    const role = String(user?.role || "").toUpperCase();
    if (role === ROLES.NURSE) {
      filter.$and = [...(filter.$and || []), { $or: [{ assignedTo: user._id }, { nurse: user._id }] }];
    }
    if ([ROLES.CONSULTANT, ROLES.PHYSIO, ROLES.PHYSIOTHERAPIST].includes(role)) {
      filter.$and = [...(filter.$and || []), { $or: [{ physiotherapist: user._id }, { physio: user._id }] }];
    }
    if (role === ROLES.PATIENT) {
      const patient = await Patient.findOne({ user: user._id }).select("_id");
      if (patient) {
        filter.patient = patient._id;
      } else {
        return 0;
      }
    }
  }
  return Appointment.countDocuments(filter);
};

exports.listTodayAppointments = async (query = {}, user) => {
  const date = query.date ? new Date(query.date) : new Date();
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const filter = { appointmentDate: { $gte: start, $lt: end }, isActive: true };
  if (query.isActive !== undefined) {
    filter.isActive = query.isActive === "false" ? false : Boolean(query.isActive);
  }
  const role = String(user?.role || "").toUpperCase();

  if (query.status) {
    filter.status = normalizeStatus(query.status);
  }

  if (query.physiotherapistId) {
    const physioLookup = [{ userId: query.physiotherapistId }, { physioId: query.physiotherapistId }];
    if (isValidObjectId(query.physiotherapistId)) {
      physioLookup.push({ _id: query.physiotherapistId });
    }
    const physio = await User.findOne({
      $or: physioLookup,
      role: { $in: [ROLES.CONSULTANT, ROLES.PHYSIO, ROLES.PHYSIOTHERAPIST] }
    }).select("_id");
    if (physio) {
      filter.physiotherapist = physio._id;
    }
  }

  if (query.time) {
    filter.timeSlot = { $regex: String(query.time).trim(), $options: "i" };
  }

  if (query.patientId) {
    await applyPatientFilter(filter, query.patientId);
  }
  if (query.roleFilter) {
    applyRoleFilter(filter, query.roleFilter);
  }

  if (!query.roleFilter) {
    if (role === ROLES.NURSE) {
      filter.$or = [{ assignedTo: user._id }, { nurse: user._id }];
    } else if ([ROLES.CONSULTANT, ROLES.PHYSIO, ROLES.PHYSIOTHERAPIST].includes(role)) {
      filter.$or = [{ physiotherapist: user._id }, { physio: user._id }];
    } else if (role === ROLES.PATIENT) {
      const selfPatient = await Patient.findOne({ user: user._id }).select("_id");
      if (!selfPatient) return [];
      filter.patient = selfPatient._id;
    }
  }

  return populateAppointment(
    Appointment.find(filter).sort({ appointmentDate: 1, timeSlot: 1 })
  );
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

exports.updateAppointmentStatusByPayload = async ({ appointmentId, status }, actorUser) => {
  if (!appointmentId || !status) {
    throw new Error("appointmentId and status are required");
  }

  const appointment = await Appointment.findOne({
    $or: [{ appointmentId }, { _id: appointmentId }]
  });

  if (!appointment) {
    throw new Error("Appointment not found");
  }

  const role = String(actorUser?.role || "").toUpperCase();
  if (role === ROLES.NURSE) {
    if (!isNurseAccessible(appointment, actorUser._id)) {
      throw new Error("Access denied for this appointment");
    }
    const allowedStatuses = ["ARRIVED", "INTAKE_COMPLETED", "READY_FOR_PT"];
    if (!allowedStatuses.includes(normalizeStatus(status))) {
      throw new Error("Invalid status update for nurse");
    }
  }

  appointment.status = normalizeStatus(status);
  if (appointment.status === "ARRIVED" && !appointment.checkInAt) {
    appointment.checkInAt = new Date();
  }
  if (appointment.status === "INTAKE_COMPLETED" || appointment.status === "READY_FOR_PT") {
    appointment.checkInAt = appointment.checkInAt || new Date();
  }

  await appointment.save();
  return populateAppointment(Appointment.findById(appointment._id));
};

exports.checkInAppointment = async (payload = {}, actorUser) => {
  const appointmentId = payload.appointmentId || payload.id;
  if (!appointmentId) {
    throw new Error("appointmentId is required");
  }

  const appointment = await Appointment.findOne({
    $or: [{ appointmentId }, { _id: appointmentId }]
  }).populate("patient");

  if (!appointment) {
    throw new Error("Appointment not found");
  }

  const role = String(actorUser?.role || "").toUpperCase();
  if (role === ROLES.NURSE && !isNurseAccessible(appointment, actorUser._id)) {
    throw new Error("Access denied for this appointment");
  }

  const nextStatus = normalizeStatus(payload.status || "ARRIVED");
  appointment.status = nextStatus;
  appointment.checkInAt = new Date();
  if (payload.appointmentType) {
    appointment.appointmentType = String(payload.appointmentType).toUpperCase();
  }
  if (payload.notes !== undefined) {
    appointment.notes = payload.notes;
  }
  await appointment.save();

  if (payload.phone || payload.email || payload.addressLine1 || payload.addressLine2 || payload.city || payload.state || payload.postalCode || payload.country) {
    const patientUpdate = {};
    if (payload.phone !== undefined) patientUpdate.phone = payload.phone;
    if (payload.email !== undefined) patientUpdate.email = payload.email;
    if (payload.addressLine1 !== undefined) patientUpdate.addressLine1 = payload.addressLine1;
    if (payload.addressLine2 !== undefined) patientUpdate.addressLine2 = payload.addressLine2;
    if (payload.city !== undefined) patientUpdate.city = payload.city;
    if (payload.state !== undefined) patientUpdate.state = payload.state;
    if (payload.postalCode !== undefined) patientUpdate.postalCode = payload.postalCode;
    if (payload.country !== undefined) patientUpdate.country = payload.country;

    if (Object.keys(patientUpdate).length) {
      patientUpdate.address = [
        patientUpdate.addressLine1 ?? appointment.patient?.addressLine1,
        patientUpdate.addressLine2 ?? appointment.patient?.addressLine2,
        patientUpdate.city ?? appointment.patient?.city,
        patientUpdate.state ?? appointment.patient?.state,
        patientUpdate.postalCode ?? appointment.patient?.postalCode,
        patientUpdate.country ?? appointment.patient?.country
      ]
        .filter(Boolean)
        .join(", ");
      await Patient.findByIdAndUpdate(appointment.patient?._id, patientUpdate);
    }
  }

  return Appointment.findById(appointment._id)
    .populate({ path: "patient", select: "firstName lastName patientId phone" })
    .populate({ path: "assignedTo", select: "name nurseId userId role" })
    .populate({ path: "nurse", select: "name nurseId userId role" })
    .populate({ path: "physiotherapist", select: "name physioId userId role" })
    .populate({ path: "physio", select: "name physioId userId role" });
};
