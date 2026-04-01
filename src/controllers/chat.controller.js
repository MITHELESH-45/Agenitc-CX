const chatService = require("../services/chat.service");

async function postChat(req, res, next) {
  try {
    const { message, userId } = req.body || {};

    if (typeof message !== "string" || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: "`message` is required and must be a non-empty string" }
      });
    }

    if (typeof userId !== "string" || userId.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: "`userId` is required and must be a non-empty string" }
      });
    }

    const result = await chatService.handleUserMessage({
      message: message.trim(),
      userId: userId.trim()
    });

    // Default response: just the reply (as requested).
    // If you want debug metadata, call: POST /api/chat?debug=1
    const debug = String(req.query.debug || "").toLowerCase();
    const includeDebug = debug === "1" || debug === "true" || debug === "yes";

    if (includeDebug) {
      return res.status(200).json(result);
    }

    return res.status(200).send(result.reply);
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  postChat
};

