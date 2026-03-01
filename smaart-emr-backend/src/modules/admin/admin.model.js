// =========================================================
// ADMIN MODEL
// =========================================================
const mongoose = require("mongoose");
const User = require("../user/user.model");

const adminSchema = new mongoose.Schema(
  {
    // Inherited from User: firstName, lastName, email, phone, password, role, etc.
    adminType: {
      type: String,
      enum: ["SUPER_ADMIN", "ADMIN", "STAFF_ADMIN"],
      default: "ADMIN"
    },
    permissions: [String],
    department: {
      type: String,
      default: "ADMINISTRATION"
    },
    canManageUsers: {
      type: Boolean,
      default: false
    },
    canManageAppointments: {
      type: Boolean,
      default: false
    },
    canGenerateReports: {
      type: Boolean,
      default: false
    },
    canManageSettings: {
      type: Boolean,
      default: false
    },
    canApprovePatients: {
      type: Boolean,
      default: false
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null
    },
    activityLog: [
      {
        action: String,
        details: String,
        timestamp: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

const Admin = User.discriminator("Admin", adminSchema);
module.exports = Admin;
