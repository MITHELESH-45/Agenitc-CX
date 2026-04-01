async function handleUserMessage({ message, userId }) {
  // Placeholder business logic (Phase 1)
  // Future: route to Router Agent, invoke RAG/Actions, persist conversation, etc.
  return {
    reply: `You said: ${message}`
  };
}

module.exports = {
  handleUserMessage
};

