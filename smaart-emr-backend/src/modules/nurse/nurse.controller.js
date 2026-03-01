const mongoose = require("mongoose");
const nurseService = require("./nurse.service");
const { success, error } = require("../../utils/responseHandler");
const Patient = require("../patient/patient.model");
const userService = require("../user/user.service");
const ROLES = require("../../config/roles");
const logAudit = require("../../utils/auditLogger");
const Appointment = require("../appointment/appointment.model");
const Vitals = require("./vitals.model");
const PainAssessment = require("./painAssessment.model");
const NurseNote = require("./nurseNote.model");

exports.recordVitals = async (req, res) => {
  try {
    const vitals =
      await nurseService.recordVitals(
        req.body,
        req.user
      );

    success(
      res,
      "Vitals & medical history recorded successfully.",
      vitals,
      201
    );
  } catch (err) {
    error(res, err.message);
  }
};

exports.listVitals = async (req, res) => {
  try {
    if (req.user.role === ROLES.PATIENT) {
      const selfPatient = await Patient.findOne({ user: req.user._id });
      if (!selfPatient) {
        return error(res, "Patient profile not found", 404);
      }

      if (req.query.patientId && ![String(selfPatient._id), selfPatient.patientId].includes(String(req.query.patientId))) {
        return error(res, "Access denied", 403);
      }

      req.query.patientId = req.query.patientId || selfPatient.patientId;
    }

    if (req.user.role === ROLES.NURSE && req.query.patientId) {
      const patientRef = req.query.patientId;
      const patient =
        (await Patient.findOne({ patientId: patientRef })) ||
        (mongoose.isValidObjectId(patientRef) ? await Patient.findById(patientRef) : null);
      if (!patient) {
        return error(res, "Patient not found", 404);
      }
      const assigned = await Appointment.findOne({
        patient: patient._id,
        $or: [{ assignedTo: req.user._id }, { nurse: req.user._id }]
      });
      if (!assigned) {
        return error(res, "Access denied", 403);
      }
    }

    const vitals = await nurseService.listVitals(req.query);
    success(res, "Vitals fetched", vitals);
  } catch (err) {
    error(res, err.message);
  }
};

exports.getPatientVitals = async (req, res) => {
  try {
    if (req.user.role === ROLES.PATIENT) {
      const selfPatient = await Patient.findOne({ user: req.user._id });
      if (!selfPatient) {
        return error(res, "Patient profile not found", 404);
      }
      if (![String(selfPatient._id), selfPatient.patientId].includes(String(req.params.patientId))) {
        return error(res, "Access denied", 403);
      }
    }

    const vitals =
      await nurseService.getPatientVitals(
        req.params.patientId
      );

    success(res, "Vitals fetched", vitals);
  } catch (err) {
    error(res, err.message);
  }
};

exports.updateVitals = async (req, res) => {
  try {
    const updated = await nurseService.updateVitals(req.params.vitalsId, req.body || {}, req.user);
    success(res, "Vitals updated successfully", updated);
  } catch (err) {
    error(res, err.message);
  }
};

exports.deleteVitals = async (req, res) => {
  try {
    const updated = await nurseService.deleteVitals(req.params.vitalsId, req.user);
    success(res, "Vitals deactivated successfully", updated);
  } catch (err) {
    error(res, err.message, 400);
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const nurseId = req.user._id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [todayAppointments, checkedIn, vitalsToday, painToday] = await Promise.all([
      Appointment.countDocuments({
        $or: [{ assignedTo: nurseId }, { nurse: nurseId }],
        appointmentDate: { $gte: today, $lt: tomorrow },
        isActive: true
      }),
      Appointment.countDocuments({
        $or: [{ assignedTo: nurseId }, { nurse: nurseId }],
        appointmentDate: { $gte: today, $lt: tomorrow },
        status: { $in: ["ARRIVED", "INTAKE_COMPLETED", "READY_FOR_PT"] }
      }),
      Vitals.countDocuments({
        recordedBy: nurseId,
        recordedAt: { $gte: today, $lt: tomorrow },
        isActive: true
      }),
      PainAssessment.countDocuments({
        nurse: nurseId,
        createdAt: { $gte: today, $lt: tomorrow },
        isActive: true
      })
    ]);

    success(res, "Nurse dashboard stats", {
      todayAppointments,
      checkedIn,
      vitalsToday,
      painToday
    });
  } catch (err) {
    error(res, err.message, 500);
  }
};

exports.getAssignedAppointments = async (req, res) => {
  try {
    const query = {
      $or: [{ assignedTo: req.user._id }, { nurse: req.user._id }],
      isActive: true
    };
    if (req.query.date) {
      const start = new Date(req.query.date);
      if (!Number.isNaN(start.getTime())) {
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setDate(end.getDate() + 1);
        query.appointmentDate = { $gte: start, $lt: end };
      }
    }

    if (req.query.status) {
      query.status = String(req.query.status).toUpperCase();
    }
    if (req.query.search) {
      const q = String(req.query.search).trim();
      const patientMatches = await Patient.find({
        $or: [
          { patientId: { $regex: q, $options: "i" } },
          { firstName: { $regex: q, $options: "i" } },
          { lastName: { $regex: q, $options: "i" } },
          { phone: { $regex: q, $options: "i" } }
        ]
      }).select("_id");
      query.patient = { $in: patientMatches.map((p) => p._id) };
    }

    const appointments = await Appointment.find(query)
      .populate("patient", "patientId firstName lastName phone")
      .populate("physiotherapist", "userId physioId name role")
      .populate("physio", "userId physioId name role")
      .sort({ appointmentDate: 1, timeSlot: 1 });

    success(res, "Assigned appointments fetched", appointments);
  } catch (err) {
    error(res, err.message, 400);
  }
};

exports.updateAssignedAppointmentStatus = async (req, res) => {
  try {
    const allowedStatuses = ["ARRIVED", "INTAKE_COMPLETED", "READY_FOR_PT"];
    const status = String(req.body.status || "").toUpperCase();
    if (!allowedStatuses.includes(status)) {
      return error(res, "Invalid status update for nurse", 400);
    }

    const appointment = await Appointment.findOne({
      $or: [{ appointmentId: req.params.appointmentId }, { _id: req.params.appointmentId }]
    });
    if (!appointment) return error(res, "Appointment not found", 404);
    if (![String(appointment.assignedTo || ""), String(appointment.nurse || "")].includes(String(req.user._id))) {
      return error(res, "Access denied for this appointment", 403);
    }

    appointment.status = status;
    appointment.checkInAt = appointment.checkInAt || new Date();
    if (req.body.notes !== undefined) {
      appointment.notes = req.body.notes;
    }
    await appointment.save();

    success(res, "Appointment status updated", appointment);
  } catch (err) {
    error(res, err.message, 400);
  }
};

exports.getAssignedPatients = async (req, res) => {
  try {
    const appointments = await Appointment.find({
      $or: [{ assignedTo: req.user._id }, { nurse: req.user._id }],
      isActive: true
    }).populate("patient", "patientId firstName lastName phone updatedAt");

    const map = new Map();
    appointments.forEach((row) => {
      const patient = row.patient;
      if (!patient) return;
      const key = String(patient._id);
      const lastVisit = row.appointmentDate || row.updatedAt || row.createdAt;
      if (!map.has(key) || new Date(lastVisit) > new Date(map.get(key).lastVisit)) {
        map.set(key, {
          ...patient.toObject(),
          lastVisit
        });
      }
    });

    let patients = Array.from(map.values());
    if (req.query.search) {
      const q = String(req.query.search).toLowerCase();
      patients = patients.filter((row) =>
        [row.patientId, row.firstName, row.lastName, row.phone].some((field) =>
          String(field || "").toLowerCase().includes(q)
        )
      );
    }

    success(res, "Assigned patients fetched", patients);
  } catch (err) {
    error(res, err.message, 400);
  }
};

exports.getAssignedPatientSummary = async (req, res) => {
  try {
    const date = req.query.date ? new Date(req.query.date) : null;
    const query = { $or: [{ assignedTo: req.user._id }, { nurse: req.user._id }], isActive: true };
    if (date && !Number.isNaN(date.getTime())) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      query.appointmentDate = { $gte: start, $lt: end };
    }

    const appointments = await Appointment.find(query)
      .populate("patient", "patientId firstName lastName phone")
      .populate("physiotherapist", "userId physioId name role")
      .populate("physio", "userId physioId name role")
      .sort({ appointmentDate: 1, timeSlot: 1 });

    const payload = appointments.map((row) => ({
      appointmentId: row.appointmentId,
      appointmentDate: row.appointmentDate,
      patientId: row?.patient?.patientId,
      patientName: `${row?.patient?.firstName || ""} ${row?.patient?.lastName || ""}`.trim(),
      assignedPhysio:
        row?.physio?.name ||
        row?.physiotherapist?.name ||
        row?.physio?.physioId ||
        row?.physiotherapist?.physioId ||
        row?.physio?.userId ||
        row?.physiotherapist?.userId
    }));

    success(res, "Assigned patient summary fetched", payload);
  } catch (err) {
    error(res, err.message, 400);
  }
};

// ==================== Pain Assessments ====================
exports.createPainAssessment = async (req, res) => {
  try {
    const record = await nurseService.createPainAssessment(req.body || {}, req.user);
    success(res, "Pain assessment created", record, 201);
  } catch (err) {
    error(res, err.message, 400);
  }
};

exports.listPainAssessments = async (req, res) => {
  try {
    const records = await nurseService.listPainAssessments(req.query || {}, req.user);
    success(res, "Pain assessments fetched", records);
  } catch (err) {
    error(res, err.message, 400);
  }
};

exports.updatePainAssessment = async (req, res) => {
  try {
    const updated = await nurseService.updatePainAssessment(req.params.assessmentId, req.body || {}, req.user);
    success(res, "Pain assessment updated", updated);
  } catch (err) {
    error(res, err.message, 400);
  }
};

exports.deletePainAssessment = async (req, res) => {
  try {
    const updated = await nurseService.deletePainAssessment(req.params.assessmentId, req.user);
    success(res, "Pain assessment deactivated", updated);
  } catch (err) {
    error(res, err.message, 400);
  }
};

// ==================== Nurse Notes ====================
exports.createNurseNote = async (req, res) => {
  try {
    const record = await nurseService.createNurseNote(req.body || {}, req.user);
    success(res, "Nurse note created", record, 201);
  } catch (err) {
    error(res, err.message, 400);
  }
};

exports.listNurseNotes = async (req, res) => {
  try {
    const records = await nurseService.listNurseNotes(req.query || {}, req.user);
    success(res, "Nurse notes fetched", records);
  } catch (err) {
    error(res, err.message, 400);
  }
};

exports.updateNurseNote = async (req, res) => {
  try {
    const updated = await nurseService.updateNurseNote(req.params.noteId, req.body || {}, req.user);
    success(res, "Nurse note updated", updated);
  } catch (err) {
    error(res, err.message, 400);
  }
};

exports.deleteNurseNote = async (req, res) => {
  try {
    const updated = await nurseService.deleteNurseNote(req.params.noteId, req.user);
    success(res, "Nurse note deactivated", updated);
  } catch (err) {
    error(res, err.message, 400);
  }
};

exports.updateMyProfile = async (req, res) => {
  try {
    const { name, phone, email } = req.body || {};
    const update = {};
    if (name !== undefined) update.name = name;
    if (phone !== undefined) update.phone = phone;
    if (email !== undefined) update.email = email;

    const nurse = await userService.updateUser(req.user._id, update);
    if (!nurse) return error(res, "Nurse not found", 404);

    await logAudit({
      userId: req.user._id,
      role: req.user.role,
      action: "UPDATE",
      entityType: "NurseProfile",
      entityId: req.user._id
    });

    const nurseObj = nurse.toObject ? nurse.toObject() : nurse;
    delete nurseObj.password;
    success(res, "Profile updated successfully", nurseObj);
  } catch (err) {
    error(res, err.message, 400);
  }
};

exports.updateNurse = async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    const updateData = { name, email, phone };

    const nurse = await userService.updateUser(req.params.nurseId, updateData);

    // Log audit entry
    await logAudit({
      userId: req.user._id,
      role: req.user.role,
      action: "UPDATE",
      entityType: "Nurse",
      entityId: req.params.nurseId,
    });

    if (!nurse) return error(res, "Nurse not found", 404);

    const nurseObj = nurse.toObject ? nurse.toObject() : nurse;
    delete nurseObj.password;

    success(res, "Nurse updated successfully", nurseObj);
  } catch (err) {
    error(res, err.message, 400);
  }
};
