const appointmentService = require("./appointment.service");
const { success, error } = require("../../utils/responseHandler");


// ======================================================
// CREATE APPOINTMENT
// Admin or Patient Portal
// ======================================================

exports.createAppointment = async (req, res) => {
  try {
    const appointment = await appointmentService.createAppointment(
      req.body,
      req.user
    );

    return success(
      res,
      "Appointment Confirmed",
      appointment,
      201
    );

  } catch (err) {
    return error(res, err.message, err.status || 400);
  }
};

exports.getAppointments = async (req, res) => {
  try {
    const appointments = await appointmentService.listAppointments(req.query, req.user);
    return success(res, "Appointments fetched successfully", appointments);
  } catch (err) {
    return error(res, err.message, err.status || 400);
  }
};


// ======================================================
// GET MY APPOINTMENTS (Role Based)
// ======================================================

exports.getMyAppointments = async (req, res) => {
  try {
    const appointments =
      await appointmentService.getAppointmentsForUser(
        req.user
      );

    return success(
      res,
      "Appointments fetched successfully",
      appointments
    );

  } catch (err) {
    return error(res, err.message, err.status || 400);
  }
};


// ======================================================
// UPDATE APPOINTMENT STATUS (Admin Only)
// ======================================================

exports.updateAppointmentStatus = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { status } = req.body;

    const updated =
      await appointmentService.updateAppointmentStatus(
        appointmentId,
        status
      );

    return success(
      res,
      "Appointment status updated",
      updated
    );

  } catch (err) {
    return error(res, err.message, err.status || 400);
  }
};
