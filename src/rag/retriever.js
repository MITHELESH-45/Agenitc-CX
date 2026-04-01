const { Chroma } = require("@langchain/community/vectorstores/chroma");

const { getEmbeddingModel, getChatModel } = require("../config/openai.config");
const logger = require("../utils/logger");

function getChromaConfig() {
  return {
    collectionName: process.env.CHROMA_COLLECTION || "agentic_cx_company_docs",
    host: process.env.CHROMA_HOST || "localhost",
    port: Number(process.env.CHROMA_PORT || 8000)
  };
}

function tokenize(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function keywordScore(query, docText) {
  const q = tokenize(query);
  const d = tokenize(docText);
  if (q.length === 0 || d.length === 0) return 0;

  const df = new Map();
  for (const t of d) df.set(t, (df.get(t) || 0) + 1);

  let score = 0;
  for (const term of q) {
    const tf = df.get(term) || 0;
    // BM25-ish but simplified: log dampening + mild normalization
    score += Math.log(1 + tf);
  }
  return score / Math.sqrt(d.length);
}

function rrfFuse(rankedLists, k = 60) {
  // rankedLists: array of arrays of items with unique key `id`
  const scores = new Map();
  for (const list of rankedLists) {
    for (let rank = 0; rank < list.length; rank += 1) {
      const item = list[rank];
      const id = item.id;
      const s = 1 / (k + rank + 1);
      scores.set(id, (scores.get(id) || 0) + s);
    }
  }

  return Array.from(scores.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => id);
}

async function llmRerank({ query, candidates, topN = 6 }) {
  const model = getChatModel();

  const payload = candidates
    .slice(0, 10)
    .map((c, i) => `[#${i}] ${c.text}`)
    .join("\n\n");

  const prompt = [
    "You are reranking context passages for a customer support QA system.",
    "Return a JSON array of passage indices (numbers) sorted by relevance to the query, most relevant first.",
    "Only include indices that are relevant. Do not include any other text.",
    "",
    `Query: ${query}`,
    "",
    "Passages:",
    payload
  ].join("\n");

  try {
    const raw = await model.invoke(prompt);
    const text = raw && raw.content ? String(raw.content) : String(raw);
    const json = JSON.parse(text.trim());
    if (!Array.isArray(json)) return candidates.slice(0, topN);

    const chosen = [];
    for (const idx of json) {
      if (Number.isInteger(idx) && idx >= 0 && idx < candidates.length) {
        chosen.push(candidates[idx]);
      }
      if (chosen.length >= topN) break;
    }
    return chosen.length ? chosen : candidates.slice(0, topN);
  } catch (err) {
    logger.error(err, { where: "rag.retriever.rerank" });
    return candidates.slice(0, topN);
  }
}

async function hybridRetrieve({ query, k = 6 }) {
  const embeddings = getEmbeddingModel();
  const chromaConfig = getChromaConfig();
  const vectorStore = new Chroma(embeddings, chromaConfig);

  // 1) Vector similarity
  const vectorHits = await vectorStore.similaritySearch(query, 12);
  const vectorRanked = vectorHits.map((doc, idx) => ({
    id: doc.metadata && doc.metadata.source ? `${doc.metadata.source}::${doc.metadata.chunk_index}` : `v_${idx}`,
    doc,
    text: doc.pageContent
  }));

  // 2) Simulated keyword search over the same candidate pool (keeps it fast & dependency-free)
  const keywordRanked = [...vectorRanked]
    .map((c) => ({ ...c, kw: keywordScore(query, c.text) }))
    .sort((a, b) => b.kw - a.kw);

  // 3) Fuse (RRF)
  const fusedIds = rrfFuse([vectorRanked, keywordRanked]);
  const byId = new Map(vectorRanked.map((x) => [x.id, x]));
  const fused = fusedIds.map((id) => byId.get(id)).filter(Boolean);

  // 4) LLM rerank
  const reranked = await llmRerank({
    query,
    candidates: fused,
    topN: k
  });

  return reranked.map((x) => x.doc);
}

module.exports = {
  hybridRetrieve
};

