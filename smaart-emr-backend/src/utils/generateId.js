const Counter = require("../shared/counters.model");

const PREFIX_MAP = {
  PATIENT: "PT",
  NURSE: "NU",
  PHYSIO: "PH",
  PHYSIOTHERAPIST: "PH",
  CONSULTANT: "PH"
};

const generateId = async (type) => {
  const normalized = String(type || "").toUpperCase();
  const prefix = PREFIX_MAP[normalized];

  if (!prefix) {
    throw new Error("Unsupported ID type");
  }

  const year = new Date().getFullYear();
  const counterKey = `${prefix}-${year}`;
  const sequence = await Counter.getNextSequence(counterKey);
  const padded = String(sequence).padStart(4, "0");

  return `${prefix}-${year}-${padded}`;
};

module.exports = generateId;
