const routerAgent = require("../agents/router.agent");
const ragAgent = require("../agents/rag.agent");
const actionAgent = require("../agents/action.agent");
const { applySentiment } = require("../agents/sentiment.handler");
const { generateResponse } = require("../agents/response.generator");
const logger = require("../utils/logger");
const { tryIdentityShortcut } = require("../utils/identityShortcut");
const { logInteraction, createTicket } = require("../utils/interactionLogger");

// Escalation reply injected when anger is detected or action fails
const ESCALATION_REPLY =
  "I understand your frustration. I'm escalating this issue to our support team — someone will follow up with you shortly.";

async function handleUserMessage({ message, userId }) {
  const startedAt = Date.now();


  const shortcut = tryIdentityShortcut(message);
  if (shortcut) {
    logger.info("chat.identity_shortcut", { intent: shortcut.meta.intent });

    // Log shortcut interaction (non-blocking)
    logInteraction({
      user: userId,
      question: message,
      answer: shortcut.reply,
      context: [],
      route: "shortcut",
      intent: shortcut.meta.intent || "identity",
      sentiment: "neutral",
      responseTime: Date.now() - startedAt
    });

    return {
      reply: shortcut.reply,
      meta: shortcut.meta
    };
  }


  const routeDecision = await routerAgent.routeMessage({ message, userId });


  let agentResult;
  let actionFailed = false;

  if (routeDecision.route === "action_agent") {
    const intent =
      routeDecision.intent && /order/i.test(routeDecision.intent)
        ? "order_status"
        : "order_status";
    agentResult = await actionAgent.handleAction({
      intent,
      entities: routeDecision.entities || {},
      userId
    });

    // Mark failure so we can escalate
    if (!agentResult || !agentResult.ok) {
      actionFailed = true;
    }
  } else {
    agentResult = await ragAgent.answerWithRag({ message, userId });
  }


  let baseText = "";
  if (agentResult && agentResult.ok && agentResult.type === "order_status") {
    baseText = `Your order is ${agentResult.status}.`;
  } else if (agentResult && agentResult.ok && agentResult.type === "rag_answer") {
    baseText = agentResult.answer;
  } else if (agentResult && agentResult.message) {
    baseText = agentResult.message;
  } else {
    baseText = "I couldn't process that request right now. Please try again.";
  }


  const shouldEscalate = routeDecision.emotion === "angry";

  if (shouldEscalate) {
    baseText = ESCALATION_REPLY;
  }

  const tonedText = shouldEscalate
    ? baseText
    : applySentiment({ emotion: routeDecision.emotion, baseText });


  const final = generateResponse({ routeDecision, agentResult, tonedText });

  // Attach RAG sources when available
  if (agentResult && agentResult.type === "rag_answer") {
    final.meta.sources = agentResult.sources;
  }

  const responseTime = Date.now() - startedAt;


  const retrievedDocs = (agentResult && agentResult.full_context)
    ? agentResult.full_context.slice(0, 5)
    : [];

  logInteraction({
    user: userId,
    question: message,
    answer: final.reply,
    context: retrievedDocs,
    route: routeDecision.route,
    intent: routeDecision.intent,
    sentiment: routeDecision.emotion,
    responseTime
  });


  if (shouldEscalate) {
    createTicket({
      user: userId,
      message,
      intent: routeDecision.intent,
      sentiment: routeDecision.emotion
    });
  }


  logger.info("chat.completed", {
    route: routeDecision.route,
    intent: routeDecision.intent,
    emotion: routeDecision.emotion,
    escalated: shouldEscalate,
    responseTime
  });

  return final;
}

module.exports = { handleUserMessage };
