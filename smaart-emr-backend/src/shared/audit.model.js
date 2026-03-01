const mongoose = require("mongoose");

const auditSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },

    role: {
      type: String
    },

    action: {
      type: String,
      required: true
    },

    entityType: {
      type: String
    },

    entityId: {
      type: mongoose.Schema.Types.ObjectId
    },

    timestamp: {
      type: Date
    },

    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    // role retained above for compatibility

    targetId: {
      type: mongoose.Schema.Types.ObjectId
    },

    targetModel: {
      type: String
    },

    metadata: {
      type: Object
    },

    ipAddress: {
      type: String
    },

    device: {
      type: String
    },

    loginTime: {
      type: Date
    },

    logoutTime: {
      type: Date
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Audit", auditSchema);
