const Patient = require("../modules/patient/patient.model");
const ROLES = require("../config/roles");
const { error } = require("../utils/responseHandler");

const roleFilterMiddleware = async (req, res, next) => {
  try {
    const role = String(req.user?.role || "").toUpperCase();
    let roleFilter = {};

    if (role === ROLES.NURSE) {
      roleFilter = { $or: [{ assignedTo: req.user._id }, { nurse: req.user._id }] };
    } else if ([ROLES.CONSULTANT, ROLES.PHYSIO, ROLES.PHYSIOTHERAPIST].includes(role)) {
      roleFilter = { $or: [{ physiotherapist: req.user._id }, { physio: req.user._id }] };
    } else if (role === ROLES.PATIENT) {
      const patient = await Patient.findOne({ user: req.user._id }).select("_id");
      if (!patient) {
        return error(res, "Patient profile not found", 404);
      }
      roleFilter = { patient: patient._id };
    }

    req.roleFilter = roleFilter;
    req.query = { ...req.query, roleFilter };
    return next();
  } catch (err) {
    return error(res, err.message || "Unable to apply role filter", 400);
  }
};

module.exports = roleFilterMiddleware;
