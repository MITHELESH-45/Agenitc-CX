const { hybridRetrieve } = require("../rag/retriever");
const { getChatModel } = require("../config/openai.config");
const logger = require("../utils/logger");

function buildContext(docs) {
  return docs
    .map((d, i) => {
      const src = (d.metadata && d.metadata.source) || "unknown";
      const chunk = d.metadata && typeof d.metadata.chunk_index !== "undefined" ? d.metadata.chunk_index : "n/a";
      return `SOURCE: ${src} (chunk ${chunk})\n${d.pageContent}`;
    })
    .join("\n\n---\n\n");
}

async function answerWithRag({ message }) {
  let docs;
  try {
    docs = await hybridRetrieve({ query: message, k: 6 });
  } catch (err) {
    logger.error(err, { where: "rag.agent.retrieve" });
    return {
      ok: false,
      type: "rag_unavailable",
      message: "RAG is unavailable right now (Chroma Cloud or embeddings not reachable). Please try again later."
    };
  }

  if (!docs || docs.length === 0) {
    return {
      ok: false,
      type: "no_rag_results",
      message: "I couldn’t find relevant information in the company documents. Could you rephrase or share more details?"
    };
  }

  const context = buildContext(docs);

  const prompt = [
    "You are a customer support assistant.",
    "Answer the user's question using ONLY the provided context.",
    "If the context does not contain the answer, say you don't have enough information and ask a follow-up question.",
    "Be concise and factual. Avoid hallucinations.",
    "",
    `User question: ${message}`,
    "",
    "Context:",
    context
  ].join("\n");

  try {
    const model = getChatModel();
    const raw = await model.invoke(prompt);
    const text = raw && raw.content ? String(raw.content) : String(raw);
    return {
      ok: true,
      type: "rag_answer",
      answer: text.trim(),
      full_context: docs.map((d) => d.pageContent || ""), // NEW: For Ragas evaluation
      sources: docs.map((d) => ({
        source: d.metadata && d.metadata.source,
        chunk_index: d.metadata && d.metadata.chunk_index
      }))
    };
  } catch (err) {
    logger.error(err, { where: "rag.agent" });
    return {
      ok: false,
      type: "openai_failure",
      message: "I’m having trouble generating an answer right now. Please try again in a moment."
    };
  }
}

module.exports = {
  answerWithRag
};

