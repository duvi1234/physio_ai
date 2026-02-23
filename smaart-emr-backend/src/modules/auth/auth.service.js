const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const jwtConfig = require("../../config/jwt");
const generateUniqueId = require("../../utils/generateUniqueId");
const generateTempPassword = require("../../utils/tempPassword");
const User = require("../user/user.model");
const Token = require("../../shared/token.model");
const ROLES = require("../../config/roles");
const auditLogger = require("../../utils/auditLogger");
const { isStrongPassword, PASSWORD_POLICY_MESSAGE } = require("../../utils/passwordPolicy");
const notificationService = require("../notification/notification.service");

const daysFromNow = (days) => new Date(Date.now() + days * 24 * 60 * 60 * 1000);
const minutesFromNow = (minutes) => new Date(Date.now() + minutes * 60 * 1000);

const generateTokens = async (user) => {
  const accessToken = jwt.sign(
    { id: user._id, role: user.role },
    jwtConfig.access.secret,
    { expiresIn: jwtConfig.access.expiresIn }
  );

  const refreshToken = jwt.sign({ id: user._id }, jwtConfig.refresh.secret, {
    expiresIn: jwtConfig.refresh.expiresIn
  });

  await Token.create({
    user: user._id,
    token: refreshToken,
    type: "REFRESH",
    expiresAt: daysFromNow(7)
  });

  return { accessToken, refreshToken };
};

exports.registerAdmin = async (data) => {
  const existingAdmin = await User.findOne({ role: { $in: [ROLES.ADMIN, ROLES.SUPER_ADMIN] } });
  if (existingAdmin) {
    throw new Error("Admin already exists");
  }

  const userId = await generateUniqueId(ROLES.ADMIN);
  const useProvidedPassword = Boolean(data?.password);
  const finalPassword = useProvidedPassword ? String(data.password) : generateTempPassword();

  if (useProvidedPassword && !isStrongPassword(finalPassword)) {
    throw new Error(PASSWORD_POLICY_MESSAGE);
  }

  await User.create({
    adminId: userId,
    userId,
    name: data.name,
    email: data.email,
    phone: data.phone,
    password: finalPassword,
    role: ROLES.ADMIN,
    mustChangePassword: !useProvidedPassword,
    isActive: true
  });

  return {
    userId,
    ...(useProvidedPassword ? {} : { temporaryPassword: finalPassword, tempPassword: finalPassword })
  };
};

exports.checkAdminExists = async () => {
  const existingAdmin = await User.exists({
    role: { $in: [ROLES.ADMIN, ROLES.SUPER_ADMIN] }
  });

  return { exists: Boolean(existingAdmin) };
};

exports.login = async (data, context = {}) => {
  const identifier = String(data?.identifier || data?.userId || "").trim();
  if (!identifier || !data?.password) {
    throw new Error("identifier and password are required");
  }

  const user = await User.findOne({
    $or: [
      { email: identifier.toLowerCase() },
      { adminId: identifier },
      { nurseId: identifier },
      { physioId: identifier },
      { patientId: identifier },
      { userId: identifier },
      { phone: identifier }
    ]
  });

  if (!user) {
    throw new Error("Invalid credentials");
  }

  const isMatch = await user.comparePassword(data.password);
  if (!isMatch) {
    throw new Error("Invalid credentials");
  }

  if (!user.isActive) {
    throw new Error("Account is disabled");
  }

  await auditLogger({
    userId: user._id,
    role: user.role,
    action: "LOGIN",
    metadata: { identifier },
    ipAddress: context.ip,
    device: context.device,
    loginTime: new Date()
  });

  if (user.mustChangePassword) {
    return {
      message: "Password change required",
      mustChangePassword: true,
      userId: user._id
    };
  }

  const tokens = await generateTokens(user);

  return {
    token: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    role: user.role,
    userId: user._id,
    mustChangePassword: false
  };
};

exports.refresh = async (refreshToken) => {
  if (!refreshToken) {
    throw new Error("Refresh token is required");
  }

  const tokenDoc = await Token.findOne({
    token: refreshToken,
    type: { $in: ["REFRESH", "refresh"] },
    isRevoked: false,
    expiresAt: { $gt: new Date() }
  });

  if (!tokenDoc) {
    throw new Error("Invalid refresh token");
  }

  const decoded = jwt.verify(refreshToken, jwtConfig.refresh.secret);
  const user = await User.findById(decoded.id);
  if (!user || !user.isActive) {
    throw new Error("Invalid refresh session");
  }

  tokenDoc.isRevoked = true;
  tokenDoc.usedAt = new Date();
  await tokenDoc.save();

  return generateTokens(user);
};

exports.logout = async (user, refreshToken, context = {}) => {
  if (refreshToken) {
    await Token.updateMany(
      {
        user: user._id,
        token: refreshToken,
        type: { $in: ["REFRESH", "refresh"] },
        isRevoked: false
      },
      {
        $set: {
          isRevoked: true,
          usedAt: new Date()
        }
      }
    );
  } else {
    await Token.updateMany(
      {
        user: user._id,
        type: { $in: ["REFRESH", "refresh"] },
        isRevoked: false
      },
      {
        $set: {
          isRevoked: true,
          usedAt: new Date()
        }
      }
    );
  }

  await auditLogger({
    userId: user._id,
    role: user.role,
    action: "LOGOUT",
    ipAddress: context.ip,
    device: context.device,
    logoutTime: new Date()
  });

  return true;
};

exports.forgotPassword = async (identifier) => {
  if (!identifier) {
    throw new Error("Email or phone is required");
  }

  const user = await User.findOne({
    $or: [{ email: identifier }, { phone: identifier }]
  });

  if (!user) {
    return { masked: true };
  }

  const rawToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

  await Token.create({
    user: user._id,
    token: hashedToken,
    type: "RESET_PASSWORD",
    expiresAt: minutesFromNow(15)
  });

  const resetLink = `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password?token=${rawToken}`;
  const message = `Use this link to reset your password (valid for 15 minutes): ${resetLink}`;

  await notificationService.sendCustomNotification({
    phone: user.phone,
    email: user.email,
    subject: "SMAART EMR Password Reset",
    message
  });

  return { masked: true };
};

exports.resetPassword = async (rawToken, newPassword) => {
  if (!rawToken || !newPassword) {
    throw new Error("Reset token and new password are required");
  }

  if (!isStrongPassword(newPassword)) {
    throw new Error(PASSWORD_POLICY_MESSAGE);
  }

  const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
  const tokenDoc = await Token.findOne({
    token: hashedToken,
    type: "RESET_PASSWORD",
    isRevoked: false,
    expiresAt: { $gt: new Date() }
  }).populate("user");

  if (!tokenDoc || !tokenDoc.user) {
    throw new Error("Invalid or expired reset token");
  }

  const user = tokenDoc.user;
  user.password = newPassword;
  user.mustChangePassword = false;
  await user.save();

  tokenDoc.isRevoked = true;
  tokenDoc.usedAt = new Date();
  await tokenDoc.save();

  await Token.updateMany(
    {
      user: user._id,
      type: { $in: ["REFRESH", "refresh"] },
      isRevoked: false
    },
    { $set: { isRevoked: true, usedAt: new Date() } }
  );

  return true;
};

exports.changePassword = async (userId, oldPassword, newPassword) => {
  if (!userId || !oldPassword || !newPassword) {
    throw new Error("userId, oldPassword and newPassword are required");
  }

  const identifier = String(userId).trim();
  const idQuery = [];
  if (mongoose.Types.ObjectId.isValid(identifier)) {
    idQuery.push({ _id: identifier });
  }
  idQuery.push(
    { adminId: identifier },
    { userId: identifier },
    { nurseId: identifier },
    { physioId: identifier },
    { patientId: identifier },
    { email: identifier.toLowerCase() }
  );

  const user = await User.findOne({ $or: idQuery });
  if (!user) {
    throw new Error("User not found");
  }

  const isMatch = await user.comparePassword(oldPassword);
  if (!isMatch) {
    throw new Error("Old password is incorrect");
  }

  if (!isStrongPassword(newPassword)) {
    throw new Error(PASSWORD_POLICY_MESSAGE);
  }

  user.password = newPassword;
  user.mustChangePassword = false;
  await user.save();

  return true;
};
