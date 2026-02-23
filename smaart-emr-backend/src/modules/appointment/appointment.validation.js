const Joi = require("joi");

exports.createAppointmentSchema = Joi.object({
  patientId: Joi.string().required(),
  physiotherapistId: Joi.string().required(),
  date: Joi.date().required(),
  timeSlot: Joi.string().required(),
  location: Joi.string().required(),
  appointmentType: Joi.string()
    .valid("WALK_IN", "VIRTUAL")
    .required(),
  notes: Joi.string().allow("", null)
});
