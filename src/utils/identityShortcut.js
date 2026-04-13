/**
 * Short-circuit replies for identity / meta questions so we don't depend on RAG or Chroma.
 * Keeps the main AI pipeline unchanged for everything else.
 */

const IDENTITY_PATTERNS =
  /\b(who are you|what are you|what'?s your name|what is your name|tell me about yourself|who is this|who built you|who made you|what is agentic\s*cx|what is agentic|what do you do|what can you (do|help)|are you (a bot|an ai|human))\b/i;

const GREETING_ONLY = /^(hi|hello|hey|good\s+(morning|afternoon|evening))\s*[!?.]?\s*$/i;

function tryIdentityShortcut(message) {
  const raw = String(message || "").trim();
  if (!raw) return null;

  const isIdentity = IDENTITY_PATTERNS.test(raw);
  const isShortGreeting = raw.length <= 40 && GREETING_ONLY.test(raw);

  if (!isIdentity && !isShortGreeting) return null;

  return {
    reply:
      "I'm Agentic CX — an AI assistant for customer support here. I can help with order status and questions about our policies and docs. What would you like to know?",
    meta: {
      intent: "assistant_identity",
      route: "identity_shortcut",
      entities: {},
      emotion: "neutral"
    }
  };
}

module.exports = { tryIdentityShortcut };
