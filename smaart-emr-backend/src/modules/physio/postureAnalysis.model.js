const mongoose = require("mongoose");

const postureAnalysisSchema = new mongoose.Schema(
  {
    analysisId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
      index: true
    },
    physiotherapist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      default: null
    },
    images: {
      front: { type: String, default: "" },
      side: { type: String, default: "" },
      back: { type: String, default: "" }
    },
    aiResult: {
      shoulderTilt: { type: String, default: "" },
      spinalCurvature: { type: String, default: "" },
      pelvicImbalance: { type: String, default: "" },
      kneeAlignment: { type: String, default: "" },
      raw: { type: Object, default: {} }
    },
    manualCorrections: {
      type: String,
      default: ""
    },
    comments: {
      type: String,
      default: ""
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("PostureAnalysis", postureAnalysisSchema);
