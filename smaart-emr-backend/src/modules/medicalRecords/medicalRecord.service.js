const MedicalRecord = require("./medicalRecord.model");
const Patient = require("../patient/patient.model");
const { AppError } = require("../../middlewares/error.middleware");

exports.createMedicalRecord = async (data, user) => {
  const patient =
    (await Patient.findOne({ patientId: data.patient })) ||
    (await Patient.findById(data.patient));

  if (!patient) {
    throw new AppError("Patient not found", 404);
  }

  const record = await MedicalRecord.create({
    ...data,
    uploadedBy: user._id
  });

  return record;
};

exports.getPatientRecords = async (patientId) => {
  const patient =
    (await Patient.findOne({ patientId })) ||
    (await Patient.findById(patientId));

  if (!patient) {
    throw new AppError("Patient not found", 404);
  }

  return await MedicalRecord.find({
    patient: patient._id,
    isActive: true
  })
    .populate("uploadedBy", "uniqueId role")
    .sort({ createdAt: -1 });
};

exports.deleteRecord = async (recordId) => {
  const record = await MedicalRecord.findById(recordId);
  if (!record) {
    throw new AppError("Record not found", 404);
  }

  record.isActive = false;
  await record.save();

  return true;
};
