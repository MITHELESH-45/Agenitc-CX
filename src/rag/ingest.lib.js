const fs = require("fs");
const path = require("path");
const { PDFParse } = require("pdf-parse");

const { RecursiveCharacterTextSplitter } = require("@langchain/textsplitters");
const { Document } = require("@langchain/core/documents");
const { Chroma } = require("@langchain/community/vectorstores/chroma");

const { getEmbeddingModel } = require("../config/openai.config");
const logger = require("../utils/logger");
const { getCollectionName, getChromaHost, getChromaPort, getChromaDataPath } = require("./chroma.config");
const { startLocalChromaServer } = require("./chroma.runtime");

function getChromaConfig() {
  return {
    collectionName: getCollectionName(),
    host: getChromaHost(),
    port: getChromaPort()
  };
}

async function loadPdfDocumentsFromDataFolder() {
  const dataDir = path.resolve(__dirname, "..", "..", "data");
  if (!fs.existsSync(dataDir)) {
    throw new Error(`Data folder not found: ${dataDir}`);
  }

  const files = fs.readdirSync(dataDir).filter((f) => f.toLowerCase().endsWith(".pdf"));
  if (files.length === 0) {
    throw new Error(`No PDF files found in: ${dataDir}`);
  }

  const docs = [];
  for (const file of files) {
    const filePath = path.join(dataDir, file);
    const buffer = fs.readFileSync(filePath);
    const parser = new PDFParse({ data: buffer });
    // eslint-disable-next-line no-await-in-loop
    const parsed = await parser.getText();
    const text = (parsed && parsed.text ? parsed.text : "").trim();

    if (!text) {
      logger.warn("Skipping empty PDF text", { file });
      continue;
    }

    docs.push(
      new Document({
        pageContent: text,
        metadata: {
          source: file,
          filePath
        }
      })
    );
  }
  return docs;
}

/**
 * Ingest PDFs from /data into Chroma.
 * Returns metadata that can be used by admin endpoints.
 */
async function ingestRag() {
  // Ensure a local persistent Chroma is available for ingestion (Linux/Render).
  // On Windows, auto-start is skipped (see chroma.runtime) so you must run Chroma separately.
  const chromaProcess = await startLocalChromaServer();

  try {
    const embeddings = getEmbeddingModel();
    const chromaConfig = getChromaConfig();

    logger.info("rag.ingest_start", { ...chromaConfig, dataPath: getChromaDataPath() });

    const rawDocs = await loadPdfDocumentsFromDataFolder();

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 300,
      chunkOverlap: 50
    });

    const chunked = await splitter.splitDocuments(rawDocs);

    const docsWithChunkMeta = chunked.map((d, idx) => {
      return new Document({
        pageContent: d.pageContent,
        metadata: {
          ...d.metadata,
          chunk_index: idx
        }
      });
    });

    const ids = docsWithChunkMeta.map((d) => {
      const src = d.metadata.source || "unknown";
      const i = d.metadata.chunk_index;
      return `${src}::chunk_${i}`;
    });

    const vectorStore = new Chroma(embeddings, chromaConfig);
    await vectorStore.addDocuments(docsWithChunkMeta, { ids });

    logger.info("rag.ingest_complete", { chunks: docsWithChunkMeta.length });
    return { ok: true, chunks: docsWithChunkMeta.length };
  } finally {
    try {
      if (chromaProcess && typeof chromaProcess.kill === "function") chromaProcess.kill();
    } catch (_) {
      // ignore
    }
  }
}

module.exports = { ingestRag };

