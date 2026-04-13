const fs = require("fs");
const path = require("path");
const { ChromaClient } = require("chromadb");

const logger = require("../utils/logger");

function getChromaDataPath() {
  return process.env.CHROMA_DATA_PATH || "./chroma-data";
}

function getCollectionName() {
  return process.env.CHROMA_COLLECTION || "agentic_cx_company_docs";
}

function ensureChromaDir() {
  const dir = path.resolve(process.cwd(), getChromaDataPath());
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

let cachedClient = null;

function getChromaClient() {
  if (cachedClient) return cachedClient;

  const dir = ensureChromaDir();
  const client = new ChromaClient({ path: dir });
  logger.info("chroma.initialized", { dataPath: dir });
  cachedClient = client;
  return cachedClient;
}

async function getCollection() {
  const client = getChromaClient();
  const name = getCollectionName();
  const collection = await client.getOrCreateCollection({ name });
  logger.info("chroma.collection_loaded", { collection: name });
  return collection;
}

module.exports = {
  getChromaClient,
  getCollection,
  getCollectionName,
  getChromaDataPath,
  ensureChromaDir
};

