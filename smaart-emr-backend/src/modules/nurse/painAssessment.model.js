const mongoose = require("mongoose");

const painAssessmentSchema = new mongoose.Schema(
  {
    assessmentId: {
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
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      default: null
    },
    nurse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    painScore: {
      type: Number,
      min: 0,
      max: 10,
      required: true
    },
    bodyArea: {
      type: String,
      required: true,
      trim: true
    },
    painType: {
      type: String,
      default: ""
    },
    description: {
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

module.exports = mongoose.model("PainAssessment", painAssessmentSchema);
