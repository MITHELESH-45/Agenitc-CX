require("dotenv").config();

const app = require("./src/app");
const logger = require("./src/utils/logger");
const { connectMongo } = require("./src/db/mongo");
const { startEmailListener } = require("./src/services/email.listener");

const PORT = process.env.PORT || 3000;

let server;
let emailListener;

async function start() {
  try {
    await connectMongo();
  } catch (err) {
    // Don't crash the whole server on Mongo issues (RAG-only paths should still work).
    logger.error(err);
  }

  server = app.listen(PORT, () => {
    logger.info(`Agentic-CX backend listening on port ${PORT}`);
  });

  // Email channel (Gmail IMAP polling + SMTP reply). Safe no-op if env vars missing.
  emailListener = startEmailListener();
}

start().catch((err) => {
  logger.error(err);
  process.exit(1);
});

function shutdown(signal) {
  logger.info(`Received ${signal}. Shutting down...`);
  if (!server) process.exit(0);

  try {
    if (emailListener && typeof emailListener.stop === "function") {
      emailListener.stop();
    }
  } catch (err) {
    logger.error(err);
  }

  server.close(() => {
    logger.info("HTTP server closed.");
    process.exit(0);
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

