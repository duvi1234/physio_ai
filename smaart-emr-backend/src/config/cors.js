const cors = require("cors");

const allowedOrigins = (process.env.CORS_ORIGIN || "").split(",").map((x) => x.trim()).filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (!allowedOrigins.length || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("CORS origin not allowed"), false);
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  credentials: true
};

module.exports = cors(corsOptions);
