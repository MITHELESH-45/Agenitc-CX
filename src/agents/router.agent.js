const { StructuredOutputParser } = require("@langchain/core/output_parsers");
const { PromptTemplate } = require("@langchain/core/prompts");
const { z } = require("zod");

const { getChatModel } = require("../config/openai.config");
const logger = require("../utils/logger");

const RouterSchema = z.object({
  intent: z.string().min(1).describe("Short intent label"),
  route: z.enum(["rag_agent", "action_agent"]),
  entities: z
    .object({
      order_id: z.string().optional().describe("Order id if present, e.g. 1234")
    })
    .passthrough(),
  emotion: z.enum(["neutral", "frustrated", "angry"])
});

async function routeMessage({ message }) {
  const parser = StructuredOutputParser.fromZodSchema(RouterSchema);

  const prompt = new PromptTemplate({
    template: [
      "You are a router for a customer support system.",
      "Extract a structured JSON object for the user message.",
      "",
      "Rules:",
      "- Output MUST follow the schema and be valid JSON.",
      "- route=action_agent when the user asks about order status, refunds, account changes, or requests an action.",
      "- route=rag_agent when the user asks FAQs, policies, product info, or general questions.",
      "- If emotion shows anger (all caps, insults, threats, strong negative), set emotion=angry.",
      "- If user is upset/complaining but not extreme, set emotion=frustrated.",
      "- Otherwise neutral.",
      "- Extract order_id from the message if present.",
      "",
      "{format_instructions}",
      "",
      "User message: {message}"
    ].join("\n"),
    inputVariables: ["message"],
    partialVariables: {
      format_instructions: parser.getFormatInstructions()
    }
  });

  try {
    const model = getChatModel();
    const formatted = await prompt.format({ message });
    const raw = await model.invoke(formatted);
    const text = raw && raw.content ? String(raw.content) : String(raw);

    const parsed = await parser.parse(text);
    return parsed;
  } catch (err) {
    logger.error(err, { where: "router.agent" });
    // Fallback heuristic routing so the system still responds.
    const orderMatch = String(message).match(/\b(\d{3,})\b/);
    const likelyAction = /order|refund|cancel|status|delivery|delivered|late/i.test(String(message));
    const angry = /angry|furious|ridiculous|hate|worst|never|sucks|useless/i.test(String(message));
    const frustrated = /upset|frustrat|annoy|disappoint|late/i.test(String(message));

    return {
      intent: likelyAction ? "order_status" : "faq",
      route: likelyAction ? "action_agent" : "rag_agent",
      entities: { order_id: orderMatch ? orderMatch[1] : undefined },
      emotion: angry ? "angry" : frustrated ? "frustrated" : "neutral"
    };
  }
}

module.exports = {
  routeMessage
};

