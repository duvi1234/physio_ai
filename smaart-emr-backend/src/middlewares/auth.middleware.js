const jwt = require("jsonwebtoken");
const User = require("../modules/user/user.model");
const jwtConfig = require("../config/jwt");
const { error } = require("../utils/responseHandler");

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return error(res, "Unauthorized. No token provided.", 401);
    }

    const decoded = jwt.verify(token, jwtConfig.access.secret);
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return error(res, "Invalid token.", 401);
    }

    if (!user.isActive) {
      return error(res, "User account is disabled.", 403);
    }

    req.user = user;
    return next();
  } catch (err) {
    return error(res, "Unauthorized access.", 401);
  }
};

module.exports = authMiddleware;
