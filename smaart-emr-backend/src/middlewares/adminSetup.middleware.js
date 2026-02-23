const User = require("../modules/user/user.model");
const ROLES = require("../config/roles");
const { error } = require("../utils/responseHandler");

const adminSetupLock = async (req, res, next) => {
  try {
    const adminExists = await User.exists({
      role: { $in: [ROLES.ADMIN, ROLES.SUPER_ADMIN] }
    });

    if (adminExists) {
      return error(res, "Admin already initialized. Public admin registration is disabled.", 403);
    }

    return next();
  } catch (err) {
    return error(res, "Failed to verify admin setup state.", 500);
  }
};

module.exports = adminSetupLock;
