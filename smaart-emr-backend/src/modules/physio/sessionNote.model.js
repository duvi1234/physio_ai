const mongoose = require("mongoose");

const sessionNoteSchema = new mongoose.Schema(
  {
    sessionNoteId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true
    },
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      required: true,
      index: true
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
    diagnosis: {
      type: String,
      default: ""
    },
    observations: {
      type: String,
      default: ""
    },
    treatmentGiven: {
      type: String,
      default: ""
    },
    recommendations: {
      type: String,
      default: ""
    },
    followUpDate: {
      type: Date,
      default: null
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("SessionNote", sessionNoteSchema);
