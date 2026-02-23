const mongoose = require("mongoose");

const consultantSchema = new mongoose.Schema(
  {
    physioId: {
      type: String,
      unique: true,
      sparse: true,
      index: true
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    specialization: {
      type: String,
      required: true,
    },

    qualification: String,

    experienceYears: {
      type: Number,
      default: 0,
    },

    consultationFee: {
      type: Number,
      default: 0,
    },

    availability: [
      {
        day: {
          type: String,
          required: true, // Monday, Tuesday
        },
        startTime: {
          type: String, // "09:00"
          required: true,
        },
        endTime: {
          type: String, // "17:00"
          required: true,
        },
      },
    ],

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Consultant", consultantSchema);
