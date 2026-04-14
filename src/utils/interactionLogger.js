const Interaction = require("../db/models/interaction.model");
const Ticket = require("../db/models/ticket.model");
const logger = require("./logger");

/**
 * Log a completed user↔AI interaction to MongoDB.
 * Non-blocking: errors are logged but never thrown so the chat flow is never broken.
 *
 * @param {object} opts
 * @param {string} opts.user       - User identifier (userId or WhatsApp sender)
 * @param {string} opts.question   - Raw user message
 * @param {string} opts.answer     - Final reply sent to user
 * @param {string[]} [opts.context]  - Retrieved RAG source snippets
 * @param {string} [opts.route]    - "rag_agent" | "action_agent" | "shortcut"
 * @param {string} [opts.intent]   - Intent label from router
 * @param {string} [opts.sentiment] - "neutral" | "frustrated" | "angry"
 * @param {number} [opts.responseTime] - Latency in ms (BONUS)
 */
async function logInteraction(opts) {
  try {
    const {
      user,
      question,
      answer,
      context = [],
      route = "rag_agent",
      intent = "",
      sentiment = "neutral",
      responseTime = 0
    } = opts;

    await Interaction.create({
      user,
      question,
      answer,
      context,
      route,
      intent,
      sentiment,
      responseTime
    });

    logger.info("interaction.logged", { user, route, intent, sentiment, responseTime });
  } catch (err) {
    // Never crash the main chat flow
    logger.error("interaction.log_failed", { message: err.message });
  }
}

/**
 * Create an escalation ticket.
 * Triggered when sentiment === "angry" or action agent fails.
 *
 * @param {object} opts
 * @param {string} opts.user
 * @param {string} opts.message
 * @param {string} [opts.intent]
 * @param {string} [opts.sentiment]
 */
async function createTicket(opts) {
  try {
    const { user, message, intent = "", sentiment = "angry" } = opts;

    await Ticket.create({
      user,
      message,
      intent,
      sentiment,
      status: "open",
      escalated: true
    });

    logger.info("ticket.created", { user, intent, sentiment });
  } catch (err) {
    logger.error("ticket.create_failed", { message: err.message });
  }
}

module.exports = { logInteraction, createTicket };
