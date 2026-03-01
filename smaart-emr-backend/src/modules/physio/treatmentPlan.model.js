const mongoose = require("mongoose");

const exerciseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    category: { type: String, required: true },
    videoUrl: { type: String, default: "" },
    instructions: { type: String, default: "" },
    sets: { type: Number, default: 0 },
    reps: { type: Number, default: 0 },
    frequency: { type: String, default: "" },
    safetyNotes: { type: String, default: "" }
  },
  { _id: false }
);

const treatmentPlanSchema = new mongoose.Schema(
  {
    planId: {
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
    summary: {
      type: String,
      default: ""
    },
    exercises: [exerciseSchema],
    aiSuggested: {
      type: Object,
      default: {}
    },
    status: {
      type: String,
      enum: ["DRAFT", "ACTIVE", "COMPLETED"],
      default: "ACTIVE"
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("TreatmentPlan", treatmentPlanSchema);
