const { error: errorResponse } = require("../utils/responseHandler");

class AppError extends Error {
  constructor(message, status = 500, data = null) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

const errorMiddleware = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  const status = err.status || 500;
  const message = err.message || "Internal Server Error";
  const data = err.data || null;

  return errorResponse(res, message, status, data);
};

module.exports = errorMiddleware;
module.exports.AppError = AppError;
