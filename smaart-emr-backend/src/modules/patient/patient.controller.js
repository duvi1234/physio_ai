const patientService = require("./patient.service");
const appointmentService = require("../appointment/appointment.service");
const { success, error } = require("../../utils/responseHandler");
const path = require("path");
const logAudit = require("../../utils/auditLogger");

const withPhotoUrl = (req, patient) => {
  const payload = patient?.toObject ? patient.toObject() : { ...(patient || {}) };
  if (payload.profilePhotoUrl) {
    payload.photoUrl = `${req.protocol}://${req.get("host")}/${String(payload.profilePhotoUrl).replace(/^\/+/, "")}`;
  } else {
    payload.photoUrl = "";
  }
  return payload;
};

exports.createPatient = async (req, res) => {
  try {
    const { patientId, ...payload } = req.body || {};
    const created = await patientService.createPatient(payload);

    success(
      res,
      "Patient ID successfully created.",
      {
        patient: created.patient,
        temporaryPassword: created.temporaryPassword
      },
      201
    );
  } catch (err) {
    error(res, err.message);
  }
};

exports.listPatients = async (req, res) => {
  try {
    const patients = await patientService.listPatients(req.query);
    success(res, "Patients fetched", patients);
  } catch (err) {
    error(res, err.message);
  }
};

exports.getPatient = async (req, res) => {
  try {
    const patient = await patientService.getPatientById(
      req.params.patientId
    );

    success(res, "Patient retrieved", patient);
  } catch (err) {
    error(res, err.message, 404);
  }
};

exports.searchPatients = async (req, res) => {
  try {
    const patients = await patientService.searchPatients(
      req.query.q
    );

    success(res, "Patients fetched", patients);
  } catch (err) {
    error(res, err.message);
  }
};

exports.updatePatient = async (req, res) => {
  try {
    const patient = await patientService.updatePatient(req.params.patientId, req.body);

    // Log audit entry
    await logAudit({
      userId: req.user._id,
      role: req.user.role,
      action: "UPDATE",
      entityType: "Patient",
      entityId: req.params.patientId,
    });

    success(res, "Patient updated successfully", patient);
  } catch (err) {
    error(res, err.message);
  }
};

exports.getMyProfile = async (req, res) => {
  try {
    const patient = await patientService.getPatientByUserId(req.user._id);
    success(res, "Patient profile fetched", withPhotoUrl(req, patient));
  } catch (err) {
    error(res, err.message, 404);
  }
};

exports.updateMyProfile = async (req, res) => {
  try {
    const patient = await patientService.updatePatientByUserId(req.user._id, req.body || {});
    success(res, "Patient profile updated successfully", withPhotoUrl(req, patient));
  } catch (err) {
    error(res, err.message);
  }
};

exports.uploadMyProfilePhoto = async (req, res) => {
  try {
    if (!req.file) {
      return error(res, "Profile photo file is required", 400);
    }
    const relativePath = path.posix.join("uploads", req.file.filename);
    const patient = await patientService.updatePatientPhotoByUserId(req.user._id, relativePath);
    success(res, "Profile photo updated successfully", withPhotoUrl(req, patient));
  } catch (err) {
    error(res, err.message);
  }
};

exports.updateMedicalHistory = async (req, res) => {
  try {
    const { patientId, ...payload } = req.body || {};
    if (!patientId) {
      return error(res, "patientId is required", 400);
    }
    const updated = await patientService.updatePatientMedicalHistory(patientId, payload, req.user);
    success(res, "Patient medical history updated", updated);
  } catch (err) {
    error(res, err.message, 400);
  }
};

exports.getMyAppointments = async (req, res) => {
  try {
    const rows = await appointmentService.getAppointmentsForUser(req.user);
    success(res, "Appointments fetched", rows);
  } catch (err) {
    error(res, err.message, 400);
  }
};

exports.getPatientTimeline = async (req, res) => {
  try {
    if (String(req.user?.role || "").toUpperCase() === "PATIENT") {
      const self = await patientService.getPatientByUserId(req.user._id);
      if (!self) {
        return error(res, "Patient profile not found", 404);
      }
      const requestId = String(req.params.patientId || "");
      if (![String(self._id), String(self.patientId)].includes(requestId)) {
        return error(res, "Access denied", 403);
      }
    }
    const data = await patientService.getPatientTimeline(req.params.patientId);
    success(res, "Patient timeline fetched", data);
  } catch (err) {
    error(res, err.message, 404);
  }
};

// Admin soft delete patient
exports.deletePatient = async (req, res) => {
  try {
    const patient = await patientService.updatePatient(req.params.patientId, { isActive: false });

    if (!patient) {
      return error(res, "Patient not found", 404);
    }

    success(res, "Patient deactivated successfully", patient);
  } catch (err) {
    error(res, err.message, 400);
  }
};

// Admin reactivate patient
exports.activatePatient = async (req, res) => {
  try {
    const updated = await patientService.updatePatient(req.params.patientId, {
      isActive: true
    });
    success(res, "Patient reactivated successfully", updated);
  } catch (err) {
    error(res, err.message, 404);
  }
};
