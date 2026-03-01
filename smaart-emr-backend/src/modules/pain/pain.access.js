const ROLES = require("../../config/roles");
const Patient = require("../patient/patient.model");
const Appointment = require("../appointment/appointment.model");
const TreatmentPlan = require("../physio/treatmentPlan.model");

const resolvePatient = async (patientRef) => {
  if (!patientRef) return null;
  return (
    (await Patient.findOne({ patientId: patientRef })) ||
    (await Patient.findById(patientRef))
  );
};

const canAccessPatientPain = async (user, patient) => {
  if (!user || !patient) return false;
  const role = String(user.role || "").toUpperCase();

  if ([ROLES.ADMIN, ROLES.SUPER_ADMIN].includes(role)) {
    return true;
  }

  if (role === ROLES.PATIENT) {
    return String(patient.user || "") === String(user._id);
  }

  if (role === ROLES.NURSE) {
    const assigned = await Appointment.findOne({
      patient: patient._id,
      $or: [{ assignedTo: user._id }, { nurse: user._id }],
      isActive: true
    }).select("_id");
    return Boolean(assigned);
  }

  if ([ROLES.CONSULTANT, ROLES.PHYSIO, ROLES.PHYSIOTHERAPIST].includes(role)) {
    const appointmentAccess = await Appointment.findOne({
      patient: patient._id,
      $or: [{ physiotherapist: user._id }, { physio: user._id }],
      isActive: true
    }).select("_id");
    if (appointmentAccess) return true;

    const rehabAccess = await TreatmentPlan.findOne({
      patient: patient._id,
      physiotherapist: user._id,
      isActive: true
    }).select("_id");
    return Boolean(rehabAccess);
  }

  return false;
};

module.exports = {
  resolvePatient,
  canAccessPatientPain
};
