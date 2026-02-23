const medicalService = require("./medicalRecord.service");
const { success, error } = require("../../utils/responseHandler");
const Patient = require("../patient/patient.model");

exports.createRecord = async (req, res) => {
  try {
    if (!req.file) {
      return error(res, "File upload required", 400);
    }

    let patientRef = req.body.patient || req.body.patientId;
    if (req.user.role === "PATIENT" && !patientRef) {
      const selfPatient = await Patient.findOne({ user: req.user._id });
      if (!selfPatient) {
        return error(res, "Patient profile not found", 404);
      }
      patientRef = String(selfPatient._id);
    }

    const record = await medicalService.createMedicalRecord(
      {
        patient: patientRef,
        category: req.body.category || "OTHER",
        title: req.body.title,
        description: req.body.description,
        fileUrl: req.file.path,
        fileType: req.file.mimetype,
        fileSize: req.file.size
      },
      req.user
    );

    return success(res, "Medical record uploaded successfully", record, 201);
  } catch (err) {
    return error(res, err.message, err.status || 400);
  }
};

exports.getPatientRecords = async (req, res) => {
  try {
    if (req.user.role === "PATIENT") {
      const selfPatient = await Patient.findOne({ user: req.user._id });
      if (!selfPatient) {
        return error(res, "Patient profile not found", 404);
      }
      if (
        String(selfPatient._id) !== String(req.params.patientId) &&
        selfPatient.patientId !== req.params.patientId
      ) {
        return error(res, "Access denied", 403);
      }
    }

    const records = await medicalService.getPatientRecords(req.params.patientId);
    return success(res, "Records fetched successfully", records);
  } catch (err) {
    return error(res, err.message, err.status || 400);
  }
};

exports.getRecordsByQuery = async (req, res) => {
  try {
    const patientId = req.query.patientId;
    if (!patientId) {
      return error(res, "patientId query param is required", 400);
    }

    req.params.patientId = patientId;
    return exports.getPatientRecords(req, res);
  } catch (err) {
    return error(res, err.message, err.status || 400);
  }
};

exports.deleteRecord = async (req, res) => {
  try {
    await medicalService.deleteRecord(req.params.id);
    return success(res, "Record deleted successfully");
  } catch (err) {
    return error(res, err.message, err.status || 400);
  }
};
