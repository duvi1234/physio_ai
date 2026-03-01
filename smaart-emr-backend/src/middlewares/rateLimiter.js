// src/middlewares/rateLimiter.js
const rateLimit = require("express-rate-limit");

const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000);
const max = Number(process.env.RATE_LIMIT_MAX || 1000);

const rateLimiter = rateLimit({
  windowMs,
  max,
  standardHeaders: true,
  legacyHeaders: false,
  // Auth endpoints already use authRateLimiter with tighter limits.
  skip: (req) => req.path.startsWith("/api/auth/"),
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
    data: null
  }
});

module.exports = rateLimiter;
