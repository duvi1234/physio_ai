const Audit = require("../shared/audit.model");

const auditLogger = async ({
  userId,
  role,
  action,
  targetId,
  targetModel,
  metadata,
  ipAddress,
  device,
  loginTime,
  logoutTime
}) => {
  if (!userId || !action || !role) return null;

  return Audit.create({
    performedBy: userId,
    role,
    action,
    targetId,
    targetModel,
    metadata,
    ipAddress,
    device,
    loginTime,
    logoutTime
  });
};

module.exports = auditLogger;
