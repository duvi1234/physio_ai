// src/utils/calculateBMI.js

module.exports = (heightCm, weightKg) => {
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);

  return parseFloat(bmi.toFixed(2));
};
