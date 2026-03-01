// =========================================================
// NOTIFICATION MODEL
// =========================================================
const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    type: {
      type: String,
      enum: ["APPOINTMENT", "DOCUMENT", "MESSAGE", "SYSTEM", "REMINDER"],
      required: true
    },
    title: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    isRead: {
      type: Boolean,
      default: false
    },
    readAt: {
      type: Date,
      default: null
    },
    relatedTo: {
      resourceType: String,
      resourceId: mongoose.Schema.Types.ObjectId
    },
    actions: [
      {
        label: String,
        url: String
      }
    ],
    priority: {
      type: String,
      enum: ["LOW", "NORMAL", "HIGH"],
      default: "NORMAL"
    },
    expiresAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
