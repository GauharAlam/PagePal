"use strict";

// Load environment variables as early as possible
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const { connectDB } = require("./src/config/db");
const chatRoutes = require("./src/routes/chat.routes");
const conversationRoutes = require("./src/routes/conversation.routes");
const errorHandler = require("./src/middlewares/errorHandler");
const rateLimiter = require("./src/middlewares/rateLimiter");

const app = express();
// NOTE: macOS Monterey+ reserves port 5000 for AirPlay Receiver (Control Centre).
// We default to 5001 to avoid that conflict. Override with PORT= in your .env.
const PORT = process.env.PORT || 5001;

// ─── Security Middleware ──────────────────────────────────────────────────────
app.use(helmet());

// ─── CORS ─────────────────────────────────────────────────────────────────────
// NOTE: origin: '*' is intentionally permissive during development so the
// extension can be loaded unpacked without a fixed extension ID. For
// production, replace '*' with the exact Chrome extension origin:
//   origin: process.env.ALLOWED_ORIGINS  (e.g. 'chrome-extension://abc123')
app.use(
  cors({
    origin: "*", // TODO (prod): restrict to process.env.ALLOWED_ORIGINS
    methods: ["GET", "POST", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// ─── Request Logging ─────────────────────────────────────────────────────────
app.use(morgan("dev"));

// ─── Body Parsing ─────────────────────────────────────────────────────────────
// 50 kb cap — page content is cleaned + truncated before sending, so this
// is a safe upper-bound that still guards against abuse.
app.use(express.json({ limit: "50kb" }));

// ─── Global Rate Limiter ──────────────────────────────────────────────────────
app.use(rateLimiter);

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date() });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use("/api/chat", chatRoutes);
app.use("/api/conversations", conversationRoutes);

// ─── 404 Catch-all ────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, error: "Route not found." });
});

// ─── Global Error Handler (must be last) ─────────────────────────────────────
app.use(errorHandler);

// ─── Bootstrap ───────────────────────────────────────────────────────────────
async function bootstrap() {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`\n🚀 PagePal server running on http://localhost:${PORT}`);
    console.log(`   Environment : ${process.env.NODE_ENV || "development"}`);
    console.log(`   Health check: http://localhost:${PORT}/api/health\n`);
  });
}

bootstrap().catch((err) => {
  console.error("Fatal error during server startup:", err);
  process.exit(1);
});
