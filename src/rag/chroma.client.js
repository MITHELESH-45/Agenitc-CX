const { CloudClient, ChromaClient } = require("chromadb");
const logger = require("../utils/logger");

function getCollectionName() {
  return process.env.CHROMA_COLLECTION || "agentic_cx_company_docs";
}

let cachedClient = null;

function getChromaClient() {
  if (cachedClient) return cachedClient;

  const chromaUrl = process.env.CHROMA_URL || process.env.CHROMA_HOST;
  const chromaApiKey = process.env.CHROMA_API_KEY;
  const chromaTenant = process.env.CHROMA_TENANT || process.env.CHROMA_TENANT_ID;
  const chromaDatabase = process.env.CHROMA_DATABASE;

  if (!chromaApiKey) {
    throw new Error("Missing CHROMA_API_KEY");
  }

  let client;
  if (chromaTenant && chromaDatabase) {
    client = new CloudClient({
      tenant: chromaTenant,
      database: chromaDatabase,
      apiKey: chromaApiKey
    });
    logger.info("chroma.initialized", {
      mode: "cloud",
      tenant: chromaTenant,
      database: chromaDatabase
    });
  } else {
    if (!chromaUrl) {
      throw new Error("Missing CHROMA_URL/CHROMA_HOST for direct client mode");
    }
    client = new ChromaClient({
      path: chromaUrl,
      apiKey: chromaApiKey
    });
    logger.info("chroma.initialized", { mode: "direct", url: chromaUrl });
  }

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
  getCollectionName
};

