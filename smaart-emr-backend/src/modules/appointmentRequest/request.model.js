const mongoose = require("mongoose");

const requestSchema = new mongoose.Schema(
  {
    requestId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },

    fullName: {
      type: String,
      required: true,
      trim: true
    },

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

    department: {
      type: String,
      required: true
    },

    location: {
      type: String,
      required: true
    },

    preferredDate: Date,
    preferredTimeSlot: String,

    description: String,
    notes: {
      type: String,
      default: ""
    },

    status: {
      type: String,
      enum: [
        "PENDING",
        "CONTACTED",
        "APPROVED",
        "CONVERTED",
        "REJECTED"
      ],
      default: "PENDING"
    },

    handledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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

module.exports = mongoose.model(
  "AppointmentRequest",
  requestSchema
);
