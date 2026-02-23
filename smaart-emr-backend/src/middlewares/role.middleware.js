const { error } = require("../utils/responseHandler");

const roleMiddleware = (...rolesInput) => {
  const allowedRoles = rolesInput.flat();

  return (req, res, next) => {
    const userRole = req.user?.role;

    if (!userRole) {
      return error(res, "Unauthorized access.", 401);
    }

    if (!allowedRoles.includes(userRole)) {
      return error(res, "Access denied. Insufficient permissions.", 403);
    }

    return next();
  };
};

module.exports = roleMiddleware;
