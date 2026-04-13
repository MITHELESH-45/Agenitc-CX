const fs = require("fs");
const path = require("path");
const { PDFParse } = require("pdf-parse");

const { RecursiveCharacterTextSplitter } = require("@langchain/textsplitters");
const { Document } = require("@langchain/core/documents");

const { getEmbeddingModel } = require("../config/openai.config");
const logger = require("../utils/logger");
const { getCollection, getCollectionName, getChromaDataPath } = require("./chroma.client");

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
  try {
    const embeddings = getEmbeddingModel();
    const collection = await getCollection();

    logger.info("rag.ingest_start", {
      collectionName: getCollectionName(),
      dataPath: path.resolve(process.cwd(), getChromaDataPath())
    });

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

    const documents = docsWithChunkMeta.map((d) => d.pageContent);
    const metadatas = docsWithChunkMeta.map((d) => d.metadata || {});
    const vectors = await embeddings.embedDocuments(documents);

    await collection.upsert({
      ids,
      documents,
      metadatas,
      embeddings: vectors
    });

    logger.info("rag.ingest_complete", { chunks: docsWithChunkMeta.length });
    return { ok: true, chunks: docsWithChunkMeta.length };
  } catch (err) {
    logger.error("rag.ingest_failed", { message: err.message, stack: err.stack });
    throw err;
  }
}

module.exports = { ingestRag };

