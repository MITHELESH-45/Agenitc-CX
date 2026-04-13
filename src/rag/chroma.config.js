const path = require("path");

function getCollectionName() {
  return process.env.CHROMA_COLLECTION || "agentic_cx_company_docs";
}

/**
 * Chroma JS/TS client requires a running Chroma server.
 * For deployability, we run a local Chroma server in the same container/process
 * and persist data to disk at `./chroma-data`.
 */
function getChromaDataPath() {
  // Keep it relative to repo root for Render disk persistence.
  return process.env.CHROMA_DATA_PATH || path.resolve(process.cwd(), "chroma-data");
}

function getChromaHost() {
  // Deliberately no env host/port: fixed local-only dependency.
  return "127.0.0.1";
}

function getChromaPort() {
  return 8000;
}

function getChromaUrl() {
  return `http://${getChromaHost()}:${getChromaPort()}`;
}

module.exports = {
  getCollectionName,
  getChromaDataPath,
  getChromaHost,
  getChromaPort,
  getChromaUrl
};

