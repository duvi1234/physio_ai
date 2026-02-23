const consultantService = require("./consultant.service");
const { success, error } = require("../../utils/responseHandler");

exports.listConsultants = async (req, res) => {
  try {
    const consultants = await consultantService.listConsultants();
    success(res, "Consultants fetched", consultants);
  } catch (err) {
    error(res, err.message);
  }
};

exports.createConsultant = async (req, res) => {
  try {
    const { userId, physioId, nurseId, ...payload } = req.body || {};
    const consultant = await consultantService.createConsultant(payload);
    success(res, "Consultant created", consultant, 201);
  } catch (err) {
    error(res, err.message);
  }
};

exports.getMyProfile = async (req, res) => {
  try {
    const profile = await consultantService.getMyProfile(req.user._id);
    success(res, "Profile fetched", profile);
  } catch (err) {
    error(res, err.message);
  }
};

exports.getMyPatients = async (req, res) => {
  try {
    const patients = await consultantService.getMyPatients(req.user._id);
    success(res, "Patients fetched", patients);
  } catch (err) {
    error(res, err.message);
  }
};

exports.getPatientVitals = async (req, res) => {
  try {
    const vitals = await consultantService.getPatientVitals(
      req.params.patientId
    );
    success(res, "Vitals fetched", vitals);
  } catch (err) {
    error(res, err.message);
  }
};

exports.addConsultationNote = async (req, res) => {
  try {
    const record = await consultantService.addConsultationNote(
      req.user._id,
      req.params.patientId,
      req.body
    );
    success(res, "Consultation added", record);
  } catch (err) {
    error(res, err.message);
  }
};

exports.getPendingAppointments = async (req, res) => {
  try {
    const appointments =
      await consultantService.getPendingAppointments(req.user._id);
    success(res, "Pending appointments", appointments);
  } catch (err) {
    error(res, err.message);
  }
};

exports.acceptAppointment = async (req, res) => {
  try {
    const appointment =
      await consultantService.updateAppointmentStatus(
        req.user._id,
        req.params.appointmentId,
        "CONFIRMED"
      );
    success(res, "Appointment accepted", appointment);
  } catch (err) {
    error(res, err.message);
  }
};

exports.rejectAppointment = async (req, res) => {
  try {
    const appointment =
      await consultantService.updateAppointmentStatus(
        req.user._id,
        req.params.appointmentId,
        "CANCELLED"
      );
    success(res, "Appointment rejected", appointment);
  } catch (err) {
    error(res, err.message);
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const stats =
      await consultantService.getDashboardStats(req.user._id);
    success(res, "Dashboard stats", stats);
  } catch (err) {
    error(res, err.message);
  }
};
