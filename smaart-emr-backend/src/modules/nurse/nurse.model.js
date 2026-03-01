// =========================================================
// NURSE MODEL
// =========================================================
const mongoose = require("mongoose");
const User = require("../user/user.model");

const nurseSchema = new mongoose.Schema(
  {
    // Inherited from User: firstName, lastName, email, phone, password, role, etc.
    licenseNumber: {
      type: String,
      required: true,
      unique: true
    },
    licenseExpiry: {
      type: Date,
      required: true
    },
    specializations: [String],
    assignedPatients: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Patient"
      }
    ],
    department: {
      type: String,
      default: null
    },
    shift: {
      type: String,
      enum: ["MORNING", "AFTERNOON", "NIGHT"],
      default: "MORNING"
    },
    certifications: [
      {
        name: String,
        issuedDate: Date,
        expiryDate: Date
      }
    ],
    qualifications: [String],
    yearsOfExperience: {
      type: Number,
      default: 0
    },
    performanceRating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    isOnDuty: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

const Nurse = User.discriminator("Nurse", nurseSchema);
module.exports = Nurse;
