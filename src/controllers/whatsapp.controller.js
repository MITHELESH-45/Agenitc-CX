const chatService = require("../services/chat.service");
const logger = require("../utils/logger");


function escapeXml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}


function sendTwiML(res, bodyText) {
  const safe = escapeXml(bodyText);
  const xml = `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${safe}</Message></Response>`;
  res.status(200).type("text/xml").send(xml);
}

const FALLBACK_REPLY = "Sorry, something went wrong. Please try again.";
const EMPTY_REPLY = "We didn't receive any message. Please send your question again.";


async function postWhatsApp(req, res) {
  try {
    const body = req.body || {};
    const message = typeof body.Body === "string" ? body.Body.trim() : "";
    const sender = typeof body.From === "string" ? body.From.trim() : "";

    if (!sender) {
      logger.warn("whatsapp.webhook_missing_from", { bodyKeys: Object.keys(body) });
      return sendTwiML(res, EMPTY_REPLY);
    }

    if (!message) {
      logger.info("whatsapp.incoming_empty", { sender });
      return sendTwiML(res, EMPTY_REPLY);
    }

    logger.info("whatsapp.incoming", { sender, message });

    let replyText = FALLBACK_REPLY;
    try {
      const result = await chatService.handleUserMessage({
        message,
        userId: "user_1"
      });
      if (result && typeof result.reply === "string" && result.reply.trim().length) {
        replyText = result.reply.trim();
      }
    } catch (err) {
      logger.error("whatsapp.process_failed", { sender, err });
      replyText = FALLBACK_REPLY;
    }

    logger.info("whatsapp.reply", { sender, reply: replyText });
    return sendTwiML(res, replyText);
  } catch (err) {
    logger.error("whatsapp.webhook_error", { err });
    return sendTwiML(res, FALLBACK_REPLY);
  }
}

module.exports = {
  postWhatsApp
};
