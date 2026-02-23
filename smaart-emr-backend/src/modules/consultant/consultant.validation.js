const Joi = require("joi");

exports.consultationSchema = Joi.object({
  diagnosis: Joi.string().required(),
  prescription: Joi.string().required(),
  notes: Joi.string().allow("").optional(),
});
