const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
  {
    appointmentId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true
    },

    // 🔥 Linked to Patient Model (Make sure model name = "Patient")
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
      index: true
    },

    // Physiotherapist (User with role PHYSIOTHERAPIST)
    physiotherapist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    // Alias for physiotherapist (for role-specific populate)
    physio: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true
    },

    // Admin / Patient who booked
    bookedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    // Optional nurse assignment for ward workflow
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true
    },
    // Alias for assigned nurse (for role-specific populate)
    nurse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true
    },

    // 🔥 CRITICAL — Used by Reminder Job
    appointmentDate: {
      type: Date,
      required: true,
      index: true
    },

    timeSlot: {
      type: String,
      required: true,
      trim: true
    },

    location: {
      type: String,
      required: true,
      trim: true
    },

    appointmentType: {
      type: String,
      enum: ["WALK_IN", "VIRTUAL"],
      required: true
    },

    // 🔥 Fully aligned with all scenarios
    status: {
      type: String,
      enum: [
        "PENDING",
        "CONFIRMED",
        "ARRIVED",
        "INTAKE_COMPLETED",
        "READY_FOR_PT",
        "IN_SESSION",
        "CANCELLED",
        "COMPLETED",
        "NO_SHOW"
      ],
      default: "CONFIRMED",
      index: true
    },

    // 🔥 Used by appointmentReminder.job.js
    reminderSent: {
      type: Boolean,
      default: false,
      index: true
    },

    // EMR notes from admin/consultant
    notes: {
      type: String,
      trim: true
    },

    checkInAt: {
      type: Date,
      default: null
    },

    consultation: {
      diagnosis: {
        type: String,
        default: ""
      },
      prescription: {
        type: String,
        default: ""
      },
      notes: {
        type: String,
        default: ""
      },
      addedAt: {
        type: Date
      }
    },

    // 🔥 Important for EMR timeline
    completedAt: {
      type: Date
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);

/*
|--------------------------------------------------------------------------
| Prevent Double Booking
|--------------------------------------------------------------------------
| Same Physiotherapist
| Same Date
| Same Time Slot
*/
appointmentSchema.index(
  { physiotherapist: 1, appointmentDate: 1, timeSlot: 1 },
  { unique: true }
);

/*
|--------------------------------------------------------------------------
| Optimized Query Index
|--------------------------------------------------------------------------
| For Consultant Dashboard
*/
appointmentSchema.index(
  { physiotherapist: 1, status: 1, appointmentDate: 1 }
);

module.exports = mongoose.model("Appointment", appointmentSchema);
