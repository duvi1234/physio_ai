const mongoose = require("mongoose");

const vitalsSchema = new mongoose.Schema(
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

    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    // Physical Measurements
    height: Number, // in cm
    weight: Number, // in kg
    bmi: Number,

    // Vital Signs
    bloodPressure: String,
    pulse: Number,
    temperature: Number,
    oxygenSaturation: Number,

    // Medical History
    pastMedicalHistory: String,
    pastSurgicalHistory: String,
    allergies: [String],
    currentMedications: String,
    lifestyleFactors: String
  },
  { timestamps: true }
);

module.exports = mongoose.model("Vitals", vitalsSchema);
