const mongoose = require("mongoose");

const tokenSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    token: {
      type: String,
      required: true
    },

    type: {
      type: String,
      enum: ["ACCESS", "REFRESH", "refresh", "RESET_PASSWORD"],
      required: true
    },

    isRevoked: {
      type: Boolean,
      default: false
    },

    expiresAt: {
      type: Date,
      required: true
    },

    usedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Token", tokenSchema);
