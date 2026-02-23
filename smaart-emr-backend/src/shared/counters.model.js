const mongoose = require("mongoose");

const counterSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true
    },
    sequence: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

counterSchema.statics.getNextSequence = async function (key) {
  const counter = await this.findOneAndUpdate(
    { key },
    { $inc: { sequence: 1 } },
    {
      new: true,
      upsert: true
    }
  );

  return counter.sequence;
};

module.exports = mongoose.model("Counter", counterSchema);
