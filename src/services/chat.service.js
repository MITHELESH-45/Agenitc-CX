const routerAgent = require("../agents/router.agent");
const ragAgent = require("../agents/rag.agent");
const actionAgent = require("../agents/action.agent");
const { applySentiment } = require("../agents/sentiment.handler");
const { generateResponse } = require("../agents/response.generator");
const logger = require("../utils/logger");

async function handleUserMessage({ message, userId }) {
  const routeDecision = await routerAgent.routeMessage({ message, userId });

  let agentResult;
  if (routeDecision.route === "action_agent") {
    // Normalize intent for Phase 1 action support
    const intent = routeDecision.intent && /order/i.test(routeDecision.intent) ? "order_status" : "order_status";
    agentResult = await actionAgent.handleAction({
      intent,
      entities: routeDecision.entities || {},
      userId
    });
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

  const tonedText = applySentiment({
    emotion: routeDecision.emotion,
    baseText
  });

  const final = generateResponse({
    routeDecision,
    agentResult,
    tonedText
  });

  // Attach sources when available (useful for debugging / transparency)
  if (agentResult && agentResult.type === "rag_answer") {
    final.meta.sources = agentResult.sources;
  }

  logger.info("chat.completed", {
    route: routeDecision.route,
    intent: routeDecision.intent,
    emotion: routeDecision.emotion
  });

  return final;
}

module.exports = { handleUserMessage };

