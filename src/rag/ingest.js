require("dotenv").config();

const fs = require("fs");
const path = require("path");
const { PDFParse } = require("pdf-parse");

const { RecursiveCharacterTextSplitter } = require("@langchain/textsplitters");
const { Document } = require("@langchain/core/documents");
const { Chroma } = require("@langchain/community/vectorstores/chroma");

const { getEmbeddingModel } = require("../config/openai.config");
const logger = require("../utils/logger");

function getChromaConfig() {
  return {
    collectionName: process.env.CHROMA_COLLECTION || "agentic_cx_company_docs",
    host: process.env.CHROMA_HOST || "localhost",
    port: Number(process.env.CHROMA_PORT || 8000)
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

async function ingest() {
  const embeddings = getEmbeddingModel();
  const chromaConfig = getChromaConfig();

  logger.info("Starting PDF ingestion", chromaConfig);

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

  logger.info("Ingestion complete", { chunks: docsWithChunkMeta.length });
}

ingest()
  .then(() => process.exit(0))
  .catch((err) => {
    logger.error(err);
    process.exit(1);
  });

