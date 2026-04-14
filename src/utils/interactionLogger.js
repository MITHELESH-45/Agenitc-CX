const Interaction = require("../db/models/interaction.model");
const Ticket = require("../db/models/ticket.model");
const logger = require("./logger");


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
    logger.error("interaction.log_failed", { message: err.message });
  }
}


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
