require("dotenv").config();

const logger = require("../utils/logger");
const { ingestRag } = require("./ingest.lib");

ingestRag()
  .then(() => process.exit(0))
  .catch((err) => {
    logger.error(err);
    process.exit(1);
  });

