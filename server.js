const app = require("./src/app");
const logger = require("./src/utils/logger");

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  logger.info(`Agentic-CX backend listening on port ${PORT}`);
});

function shutdown(signal) {
  logger.info(`Received ${signal}. Shutting down...`);
  server.close(() => {
    logger.info("HTTP server closed.");
    process.exit(0);
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

