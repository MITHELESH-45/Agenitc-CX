function generateResponse({ routeDecision, agentResult, tonedText }) {
  const reply =
    tonedText ||
    (agentResult && agentResult.message) ||
    "Thanks — I’m here to help. Could you share a bit more detail?";

  return {
    reply,
    meta: {
      intent: routeDecision.intent,
      route: routeDecision.route,
      entities: routeDecision.entities || {},
      emotion: routeDecision.emotion
    }
  };
}

module.exports = {
  generateResponse
};

