const express = require("express");

const chatRoutes = require("./routes/chat.routes");
const logger = require("./utils/logger");

const app = express();

// Middleware-ready core
app.disable("x-powered-by");
app.use(express.json({ limit: "1mb" }));

// Simple request logger (kept dependency-free for Phase 1)
app.use((req, res, next) => {
  const startedAt = Date.now();
  res.on("finish", () => {
    const ms = Date.now() - startedAt;
    logger.info(`${req.method} ${req.originalUrl} ${res.statusCode} ${ms}ms`);
  });
  next();
});

app.get("/health", async (req, res) => {
  res.json({ ok: true, service: "agentic-cx-backend" });
});

app.use("/api", chatRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: "Route not found"
    }
  });
});

// Central error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const statusCode = err.statusCode && Number.isInteger(err.statusCode) ? err.statusCode : 500;
  const message = statusCode === 500 ? "Internal Server Error" : err.message;

  if (statusCode >= 500) {
    logger.error(err);
  } else {
    logger.warn(message);
  }

  res.status(statusCode).json({
    success: false,
    error: {
      message
    }
  });
});

module.exports = app;

