const Audit = require("../shared/audit.model");

async function logAudit({ userId, role, action, entityType, entityId, metadata }) {
  try {
    const timestamp = new Date();
    await Audit.create({
      userId,
      role,
      action,
      entityType,
      entityId,
      timestamp,
      performedBy: userId,
      targetId: entityId,
      targetModel: entityType,
      metadata
    });
  } catch (err) {
    console.error("Failed to log audit entry:", err);
  }
}

module.exports = logAudit;
