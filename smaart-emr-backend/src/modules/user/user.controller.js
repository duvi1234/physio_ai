const userService = require("./user.service");
const { success, error } = require("../../utils/responseHandler");
const { ROLES } = require("../../utils/constants");

exports.createNurse = async (req, res) => {
  try {
    const { userId, nurseId, physioId, ...payload } = req.body || {};
    const result = await userService.createStaff(payload, ROLES.NURSE);
    success(res, "Nurse created successfully", result, 201);
  } catch (err) {
    error(res, err.message);
  }
};

exports.createPhysio = async (req, res) => {
  try {
    const { userId, nurseId, physioId, ...payload } = req.body || {};
    const result = await userService.createStaff(payload, ROLES.PHYSIO);
    success(res, "Physiotherapist created successfully", result, 201);
  } catch (err) {
    error(res, err.message);
  }
};

exports.listStaff = async (req, res) => {
  try {
    const staff = await userService.listStaff();
    success(res, "Staff fetched successfully", staff);
  } catch (err) {
    error(res, err.message, 500);
  }
};

exports.listUsers = async (req, res) => {
  try {
    const users = await userService.listUsers(req.query);
    success(res, "Users fetched successfully", users);
  } catch (err) {
    error(res, err.message, 500);
  }
};

exports.createUser = async (req, res) => {
  try {
    const created = await userService.createUser(req.body);
    success(res, "User created successfully", created, 201);
  } catch (err) {
    error(res, err.message);
  }
};

exports.getStaffAttendanceToday = async (req, res) => {
  try {
    const attendance = await userService.getStaffAttendanceToday();
    success(res, "Staff attendance fetched successfully", attendance);
  } catch (err) {
    error(res, err.message, 500);
  }
};
