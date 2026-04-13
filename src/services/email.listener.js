const imaps = require("imap-simple");
const { simpleParser } = require("mailparser");

const logger = require("../utils/logger");
const chatService = require("./chat.service");
const { sendEmail } = require("./email.service");

const POLL_INTERVAL_MS = 10_000;
const MAX_DEDUPE_ENTRIES = 2_000;
const DEDUPE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

function hasEmailConfig() {
  return Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASS);
}

function shouldRejectUnauthorized() {
  // Default secure behavior: verify TLS certificates.
  // If you're behind a corporate proxy / antivirus that intercepts TLS,
  // set EMAIL_IMAP_REJECT_UNAUTHORIZED=false to allow the IMAP connection.
  const raw = String(process.env.EMAIL_IMAP_REJECT_UNAUTHORIZED || "").trim().toLowerCase();
  if (!raw) return true;
  return !(raw === "0" || raw === "false" || raw === "no");
}

function buildImapConfig() {
  const rejectUnauthorized = shouldRejectUnauthorized();
  return {
    imap: {
      user: process.env.EMAIL_USER,
      password: process.env.EMAIL_PASS,
      host: "imap.gmail.com",
      port: 993,
      tls: true,
      tlsOptions: { rejectUnauthorized },
      authTimeout: 10_000
    }
  };
}

function createDedupeStore() {
  /** @type {Map<string, number>} */
  const seen = new Map(); // key -> lastSeenAt (ms)

  function cleanup(now = Date.now()) {
    for (const [key, ts] of seen.entries()) {
      if (now - ts > DEDUPE_TTL_MS) seen.delete(key);
    }
    // hard cap: delete oldest-ish (Map is insertion-ordered)
    while (seen.size > MAX_DEDUPE_ENTRIES) {
      const oldestKey = seen.keys().next().value;
      if (oldestKey) seen.delete(oldestKey);
      else break;
    }
  }

  function has(key) {
    cleanup();
    return seen.has(key);
  }

  function add(key) {
    const now = Date.now();
    seen.set(key, now);
    cleanup(now);
  }

  return { has, add };
}

const dedupe = createDedupeStore();

function extractSender(parsed) {
  const from = parsed && parsed.from && parsed.from.value && parsed.from.value[0];
  return from && from.address ? String(from.address).trim() : "";
}

function extractText(parsed) {
  const text = parsed && typeof parsed.text === "string" ? parsed.text : "";
  return text.trim();
}

function buildDedupeKey({ uid, messageId, sender }) {
  if (messageId) return `mid:${messageId}`;
  if (uid != null) return `uid:${uid}`;
  return `fallback:${sender}:${Date.now()}`; // very last resort (shouldn't happen)
}

async function processOneEmail(connection, msg) {
  // imap-simple message format:
  // { attributes: { uid }, parts: [ { which, body } ] }
  const uid = msg && msg.attributes ? msg.attributes.uid : undefined;
  const parts = Array.isArray(msg && msg.parts) ? msg.parts : [];
  const bodyPart = parts.find((p) => p && p.which === "");
  const raw = bodyPart && bodyPart.body ? bodyPart.body : null;

  if (!raw) return;

  let parsed;
  try {
    parsed = await simpleParser(raw);
  } catch (err) {
    logger.error("email.parse_failed", { uid, err });
    // Mark seen to avoid infinite retry loops on malformed email.
    if (uid != null) await connection.addFlags(uid, ["\\Seen"]);
    return;
  }

  const sender = extractSender(parsed);
  const message = extractText(parsed);
  const subject = parsed && typeof parsed.subject === "string" ? parsed.subject.trim() : "";
  const messageId = parsed && parsed.messageId ? String(parsed.messageId).trim() : "";

  const dedupeKey = buildDedupeKey({ uid, messageId, sender });
  if (dedupe.has(dedupeKey)) {
    if (uid != null) await connection.addFlags(uid, ["\\Seen"]);
    return;
  }

  // Ignore empty messages
  if (!message) {
    logger.info("email.ignored_empty", { uid, sender, subject });
    dedupe.add(dedupeKey);
    if (uid != null) await connection.addFlags(uid, ["\\Seen"]);
    return;
  }

  logger.info("email.incoming", { uid, sender, subject, message });

  // Mark as seen early to avoid duplicate processing if the process restarts mid-reply.
  // Dedupe store also protects against repeated polling.
  dedupe.add(dedupeKey);
  if (uid != null) await connection.addFlags(uid, ["\\Seen"]);

  let replyText = "";
  try {
    const result = await chatService.handleUserMessage({
      message,
      // Keep email channel consistent with seeded demo data.
      // Do NOT use the sender email as userId for order lookups.
      userId: "user_1"
    });

    replyText =
      result && typeof result.reply === "string" && result.reply.trim().length
        ? result.reply.trim()
        : "Thanks for your message. I couldn't generate a reply right now—please try again.";
  } catch (err) {
    logger.error("email.ai_failed", { uid, sender, err });
    replyText =
      "Sorry — I ran into an internal error while processing your email. Please try again in a moment.";
  }

  try {
    const replySubject = subject ? `Re: ${subject}` : "Re:";
    await sendEmail(sender, replySubject, replyText);
    logger.info("email.reply_sent", { uid, sender, reply: replyText });
  } catch (err) {
    logger.error("email.reply_send_failed", { uid, sender, err });
  }
}

async function pollOnce(connection) {
  await connection.openBox("INBOX");

  const searchCriteria = ["UNSEEN"];
  const fetchOptions = {
    bodies: [""], // full raw message
    markSeen: false, // we handle flags ourselves
    struct: true
  };

  let messages = [];
  try {
    messages = await connection.search(searchCriteria, fetchOptions);
  } catch (err) {
    logger.error("email.search_failed", { err });
    return;
  }

  if (!messages || messages.length === 0) return;

  for (const msg of messages) {
    try {
      // sequential processing keeps rate-limits predictable
      // and avoids sending multiple replies from the same poll tick.
      // eslint-disable-next-line no-await-in-loop
      await processOneEmail(connection, msg);
    } catch (err) {
      const uid = msg && msg.attributes ? msg.attributes.uid : undefined;
      logger.error("email.process_failed", { uid, err });
    }
  }
}

/**
 * Start polling Gmail Inbox for unread messages and auto-reply using the AI pipeline.
 * Safe to call once at server boot.
 */
function startEmailListener() {
  if (!hasEmailConfig()) {
    logger.warn("email.listener_disabled_missing_env", {
      message: "EMAIL_USER/EMAIL_PASS not set; email listener will not start"
    });
    return { stop: () => {} };
  }

  let stopped = false;
  let connection = null;
  let isTickRunning = false;
  let timer = null;

  async function ensureConnected() {
    if (connection) return connection;
    try {
      connection = await imaps.connect(buildImapConfig());
      logger.info("email.imap_connected", { user: process.env.EMAIL_USER });
      return connection;
    } catch (err) {
      logger.error("email.imap_connect_failed", { err });
      connection = null;
      return null;
    }
  }

  async function tick() {
    if (stopped) return;
    if (isTickRunning) return;
    isTickRunning = true;

    try {
      const conn = await ensureConnected();
      if (!conn) return;
      await pollOnce(conn);
    } catch (err) {
      logger.error("email.tick_failed", { err });
      // Reset connection on unknown failures; next tick will reconnect.
      try {
        if (connection) await connection.end();
      } catch (_) {
        // ignore
      }
      connection = null;
    } finally {
      isTickRunning = false;
    }
  }

  // initial kick + interval polling
  tick().catch((err) => logger.error("email.initial_tick_failed", { err }));
  timer = setInterval(() => {
    tick().catch((err) => logger.error("email.interval_tick_failed", { err }));
  }, POLL_INTERVAL_MS);

  function stop() {
    stopped = true;
    if (timer) clearInterval(timer);
    timer = null;

    const close = connection;
    connection = null;

    if (close) {
      try {
        const maybePromise = close.end();
        if (maybePromise && typeof maybePromise.catch === "function") {
          maybePromise.catch(() => {});
        }
      } catch (_) {
        // ignore shutdown errors
      }
    }
  }

  return { stop };
}

module.exports = { startEmailListener };

