const mongoose = require("mongoose");

const alertSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
      index: true
    },
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      default: null
    },
    type: {
      type: String,
      required: true,
      trim: true
    },
    severity: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
      default: "MEDIUM"
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    source: {
      type: String,
      enum: ["AUTO", "MANUAL"],
      default: "MANUAL"
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    isResolved: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

alertSchema.index({ createdAt: -1 });
alertSchema.index({ isResolved: 1, createdAt: -1 });

module.exports = mongoose.model("Alert", alertSchema);
