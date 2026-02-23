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
    address: {
      type: String
    },

    // Insurance
    insuranceProvider: String,
    insuranceNumber: String,

    // Medical Flags
    bloodGroup: String,
    allergies: [String],

    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Patient", patientSchema);
