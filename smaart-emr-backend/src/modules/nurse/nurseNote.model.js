const mongoose = require("mongoose");

const nurseNoteSchema = new mongoose.Schema(
  {
    noteId: {
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
    nurse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    observation: {
      type: String,
      required: true
    },
    recommendations: {
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

module.exports = mongoose.model("NurseNote", nurseNoteSchema);
