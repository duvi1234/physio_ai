const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const ROLES = require("../../config/roles");

const userSchema = new mongoose.Schema(
  {
    adminId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true
    },

    userId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true
    },

    nurseId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true
    },

    physioId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true
    },

    patientId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true
    },

    name: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true
    },

    phone: {
      type: String,
      unique: true,
      sparse: true,
      trim: true
    },

    password: {
      type: String,
      required: true
    },

    role: {
      type: String,
      enum: Object.values(ROLES),
      required: true
    },

    mustChangePassword: {
      type: Boolean,
      default: true
    },

    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = function (password) {
  return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model("User", userSchema);
