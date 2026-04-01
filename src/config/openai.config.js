const { ChatOpenAI, OpenAIEmbeddings } = require("@langchain/openai");

function requireEnv(name) {
  const v = process.env[name];
  if (!v || !String(v).trim()) {
    const err = new Error(`Missing required environment variable: ${name}`);
    err.statusCode = 500;
    throw err;
  }
  return v;
}

function getChatModel() {
  const apiKey = requireEnv("OPENAI_API_KEY");
  const model = process.env.OPENAI_CHAT_MODEL || "gpt-4o-mini";

  return new ChatOpenAI({
    apiKey,
    model,
    temperature: 0
  });
}

function getEmbeddingModel() {
  const apiKey = requireEnv("OPENAI_API_KEY");
  const model = process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small";

  return new OpenAIEmbeddings({
    apiKey,
    model
  });
}

module.exports = {
  getChatModel,
  getEmbeddingModel
};

