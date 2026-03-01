const mongoose = require("mongoose");
const generateRoleId = require("../../utils/generateId");

const vitalsSchema = new mongoose.Schema(
  {
    vitalsId: {
      type: String,
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

    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    recordedAt: {
      type: Date,
      default: Date.now,
      index: true
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

    // Pain quick assessment
    painScale: {
      type: Number,
      min: 0,
      max: 10
    },
    painAffectedArea: String,
    painNotes: String,

    // Injury observation
    swelling: {
      type: Boolean,
      default: false
    },
    visibleInflammation: String,
    mobilityLimitation: {
      type: String,
      enum: ["MILD", "MODERATE", "SEVERE", ""],
      default: ""
    },

    // Medical History
    pastMedicalHistory: String,
    pastSurgicalHistory: String,
    allergies: [String],
    currentMedications: String,
    lifestyleFactors: String,
    isActive: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  { timestamps: true }
);

vitalsSchema.pre("save", async function applyVitalsId(next) {
  try {
    if (!this.vitalsId) {
      this.vitalsId = await generateRoleId("VITALS");
    }
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model("Vitals", vitalsSchema);
