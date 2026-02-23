const patientService = require("./patient.service");
const { success, error } = require("../../utils/responseHandler");

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
    const patient = await patientService.updatePatient(
      req.params.patientId,
      req.body
    );

    success(res, "Patient updated successfully", patient);
  } catch (err) {
    error(res, err.message);
  }
};
