const Counter = require("../shared/counters.model");

const generateUniqueId = async (role) => {
  const sequence = await Counter.getNextSequence(role);

  const padded = String(sequence).padStart(3, "0");

  return `${role}-SMAART-${padded}`;
};

module.exports = generateUniqueId;
