// src/middlewares/validate.middleware.js

const validateMiddleware = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
        data: null
      });
    }

    next();
  };
};

module.exports = validateMiddleware;
