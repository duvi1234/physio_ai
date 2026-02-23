const express = require("express");
const router = express.Router();
const authController = require("./auth.controller");
const authMiddleware = require("../../middlewares/auth.middleware");
const authRateLimiter = require("../../middlewares/authRateLimiter");
const adminSetupLock = require("../../middlewares/adminSetup.middleware");

router.use(authRateLimiter);
router.get("/check-admin-exists", authController.checkAdminExists);
router.post("/register-admin", adminSetupLock, authController.registerAdmin);
router.post("/login", authController.login);
router.post("/refresh", authController.refresh);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);
router.patch("/change-password", authController.changePassword);
router.post("/logout", authMiddleware, authController.logout);
router.post("/change-password", authMiddleware, authController.changePassword);

module.exports = router;
