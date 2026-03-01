const mongoose = require("mongoose");

const patientSchema = new mongoose.Schema(
  {
    patientId: {
      type: String,
      unique: true,
      required: true,
      index: true
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null // linked when patient registers portal account
    },

    // Basic Identity
    firstName: {
      type: String,
      required: true,
      trim: true
    },
    lastName: {
      type: String,
      required: true,
      trim: true
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      required: true
    },
    dateOfBirth: {
      type: Date,
      required: true
    },
    age: {
      type: Number,
      min: 0
    },

    // Contact
    phone: {
      type: String,
      required: true,
      index: true
    },
    email: {
      type: String,
      lowercase: true,
      trim: true
    },
    addressLine1: String,
    addressLine2: String,
    city: String,
    state: String,
    postalCode: String,
    country: String,
    address: String,

    emergencyContactName: {
      type: String,
      trim: true
    },
    emergencyContactRelationship: {
      type: String,
      trim: true
    },
    emergencyContactPhone: {
      type: String,
      trim: true
    },

    assignedPhysio: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    // Insurance
    insuranceProvider: String,
    insuranceNumber: String,

    // Medical Flags
    bloodGroup: String,
    allergies: [String],
    chronicConditions: [String],
    pastSurgeries: String,
    currentMedications: String,
    lifestyle: String,
    profilePhotoUrl: {
      type: String,
      default: ""
    },

    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

patientSchema.virtual("fullName").get(function getFullName() {
  return `${this.firstName || ""} ${this.lastName || ""}`.trim();
});

module.exports = mongoose.model("Patient", patientSchema);
