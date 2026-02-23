const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

const PASSWORD_POLICY_MESSAGE =
  "Password must be at least 8 characters and include uppercase, lowercase, number, and special character.";

const isStrongPassword = (password = "") => PASSWORD_REGEX.test(String(password));

module.exports = {
  PASSWORD_POLICY_MESSAGE,
  isStrongPassword
};
