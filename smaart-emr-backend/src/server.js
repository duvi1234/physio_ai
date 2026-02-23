// ===============================================
// SMAART EMR - SERVER ENTRY POINT
// ===============================================

require("dotenv").config();

const http = require("http");
const app = require("./app");

const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = http.createServer(app);

// ===============================================
// START SERVER
// ===============================================
server.listen(PORT, () => {
  console.log("=======================================");
  console.log("🚀 SMAART EMR Server Running");
  console.log(`🌐 Environment : ${process.env.NODE_ENV || "development"}`);
  console.log(`📡 Port        : ${PORT}`);
  console.log("=======================================");
});


// ===============================================
// HANDLE UNHANDLED REJECTIONS
// ===============================================
process.on("unhandledRejection", (err) => {
  console.error("❌ UNHANDLED REJECTION! Shutting down...");
  console.error(err);

  server.close(() => {
    process.exit(1);
  });
});


// ===============================================
// HANDLE UNCAUGHT EXCEPTIONS
// ===============================================
process.on("uncaughtException", (err) => {
  console.error("❌ UNCAUGHT EXCEPTION! Shutting down...");
  console.error(err);

  process.exit(1);
});


// ===============================================
// GRACEFUL SHUTDOWN (SIGTERM / SIGINT)
// ===============================================
process.on("SIGTERM", () => {
  console.log("🛑 SIGTERM received. Shutting down gracefully...");
  server.close(() => {
    console.log("💤 Process terminated");
  });
});

process.on("SIGINT", () => {
  console.log("🛑 SIGINT received. Shutting down gracefully...");
  server.close(() => {
    console.log("💤 Process terminated");
  });
});
