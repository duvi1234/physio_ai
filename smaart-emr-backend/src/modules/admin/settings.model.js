const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema(
  {
    clinicName: {
      type: String,
      default: "SMAART EMR"
    },
    clinicLogo: {
      type: String,
      default: ""
    },
    clinicEmail: {
      type: String,
      default: ""
    },
    clinicPhone: {
      type: String,
      default: ""
    },
    clinicAddress: {
      type: String,
      default: ""
    },
    timezone: {
      type: String,
      default: "UTC"
    },
    passwordPolicy: {
      minLength: { type: Number, default: 8 },
      requireSpecialChar: { type: Boolean, default: true },
      expiryDays: { type: Number, default: 90 }
    },
    forcePasswordReset: {
      type: Boolean,
      default: false
    },
    rolePermissions: {
      type: Object,
      default: {}
    },
    modules: {
      patients: { type: Boolean, default: true },
      appointments: { type: Boolean, default: true },
      nurses: { type: Boolean, default: true },
      physios: { type: Boolean, default: true },
      requests: { type: Boolean, default: true },
      reports: { type: Boolean, default: true }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Settings", settingsSchema);
