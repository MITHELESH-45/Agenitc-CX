const mongoose = require("mongoose");
const logger = require("../utils/logger");

let connected = false;

async function connectMongo() {
  if (connected) return mongoose.connection;

  const uri = process.env.MONGO_URI;
  if (!uri) {
    logger.warn("MONGO_URI not set. MongoDB features will not work.");
    return null;
  }

  mongoose.set("strictQuery", true);

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10_000
  });

  connected = true;
  logger.info("MongoDB connected");
  return mongoose.connection;
}

module.exports = {
  connectMongo
};

