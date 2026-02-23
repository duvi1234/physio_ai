const nurseService = require("./nurse.service");
const { success, error } = require("../../utils/responseHandler");
const Patient = require("../patient/patient.model");
const ROLES = require("../../config/roles");

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
