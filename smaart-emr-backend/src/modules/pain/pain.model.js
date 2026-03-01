const mongoose = require("mongoose");

const painEntrySchema = new mongoose.Schema(
  {
    entryId: {
      type: String,
      required: true,
      trim: true
    },
    bodyPart: {
      type: String,
      required: true,
      trim: true
    },
    intensity: {
      type: Number,
      required: true,
      min: 1,
      max: 10
    },
    type: {
      type: String,
      required: true,
      trim: true
    },
    duration: {
      type: String,
      required: true,
      trim: true
    },
    notes: {
      type: String,
      default: "",
      trim: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const painAssessmentSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
      index: true
    },
    painEntries: {
      type: [painEntrySchema],
      default: [],
      validate: {
        validator(entries) {
          return Array.isArray(entries) && entries.length > 0;
        },
        message: "painEntries must contain at least one entry"
      }
    },
    clinicalSummary: {
      type: String,
      default: "",
      trim: true
    },
    assessmentDate: {
      type: Date,
      default: Date.now
    },
    idempotencyKey: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
      index: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    createdByRole: {
      type: String,
      default: "",
      trim: true
    }
  },
  { timestamps: true }
);

painAssessmentSchema.index({ patientId: 1, createdAt: -1 });
painAssessmentSchema.index({ patientId: 1, assessmentDate: -1 });

module.exports = mongoose.model("PainAssessment3D", painAssessmentSchema);
