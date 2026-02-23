const mongoose = require("mongoose");

const auditSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true
    },

    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    role: {
      type: String,
      required: true
    },

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
