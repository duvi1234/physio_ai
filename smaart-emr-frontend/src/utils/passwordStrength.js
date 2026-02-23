export const passwordChecks = (password = "") => ({
  length: password.length >= 8,
  upper: /[A-Z]/.test(password),
  lower: /[a-z]/.test(password),
  number: /\d/.test(password),
  special: /[^A-Za-z0-9]/.test(password)
});

export const passwordStrengthScore = (password = "") => {
  const checks = passwordChecks(password);
  return Object.values(checks).filter(Boolean).length;
};

export const isStrongPassword = (password = "") => passwordStrengthScore(password) === 5;
