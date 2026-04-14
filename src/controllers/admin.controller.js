const fs = require("fs");
const path = require("path");
const logger = require("../utils/logger");
const { ingestRag } = require("../rag/ingest.lib");
const Interaction = require("../db/models/interaction.model");
const Ticket = require("../db/models/ticket.model");

// Path to the metrics.json file written by ragas_eval.py
const METRICS_FILE = path.resolve(__dirname, "..", "..", "metrics.json");

// ─── Ingest (existing) ────────────────────────────────────────────────────────

let ingestInFlight = null;

function isAuthorized(req) {
  const secret = process.env.ADMIN_SECRET;
  const key = typeof req.query.key === "string" ? req.query.key : "";
  return Boolean(secret && key && key === secret);
}

/**
 * GET /admin/ingest?key=...
 * Runs the RAG ingestion pipeline safely.
 */
async function runIngest(req, res) {
  if (!isAuthorized(req)) {
    return res.status(403).json({ status: "error", message: "Forbidden" });
  }

  if (ingestInFlight) {
    return res.status(200).json({ status: "success", message: "Ingestion already running" });
  }

  logger.info("admin.ingest_start");

  ingestInFlight = (async () => {
    try {
      const result = await ingestRag();
      logger.info("admin.ingest_success", result);
      return result;
    } catch (err) {
      logger.error("admin.ingest_error", { message: err.message, stack: err.stack });
      throw err;
    } finally {
      ingestInFlight = null;
    }
  })();

  try {
    await ingestInFlight;
    return res.status(200).json({ status: "success", message: "Ingestion completed" });
  } catch (err) {
    const message = err && err.message ? err.message : "Ingestion failed";
    return res.status(200).json({ status: "error", message });
  }
}

// ─── Analytics ────────────────────────────────────────────────────────────────

/**
 * GET /admin/analytics
 * Returns aggregate interaction + escalation counts.
 *
 * Response:
 * {
 *   "totalQueries": 120,
 *   "ragQueries": 50,
 *   "actionQueries": 70,
 *   "escalations": 15,
 *   "avgResponseTime": 842
 * }
 */
async function getAnalytics(req, res) {
  try {
    const [
      totalQueries,
      ragQueries,
      actionQueries,
      escalations,
      avgResponseTimeAgg
    ] = await Promise.all([
      Interaction.countDocuments(),
      Interaction.countDocuments({ route: "rag_agent" }),
      Interaction.countDocuments({ route: "action_agent" }),
      Ticket.countDocuments({ escalated: true }),
      Interaction.aggregate([
        { $group: { _id: null, avg: { $avg: "$responseTime" } } }
      ])
    ]);

    const avgResponseTime =
      avgResponseTimeAgg.length > 0
        ? Math.round(avgResponseTimeAgg[0].avg)
        : 0;

    logger.info("admin.analytics_fetched");

    return res.status(200).json({
      totalQueries,
      ragQueries,
      actionQueries,
      escalations,
      avgResponseTime
    });
  } catch (err) {
    logger.error("admin.analytics_error", { message: err.message });
    return res.status(500).json({
      success: false,
      error: { message: "Failed to fetch analytics" }
    });
  }
}

// ─── Tickets ──────────────────────────────────────────────────────────────────

/**
 * GET /admin/tickets
 * Returns all tickets sorted by newest first.
 *
 * Optional query params:
 *   ?status=open|resolved
 *   ?limit=50  (default 100)
 */
async function getTickets(req, res) {
  try {
    const filter = {};

    if (req.query.status === "open" || req.query.status === "resolved") {
      filter.status = req.query.status;
    }

    const limit = parseInt(req.query.limit, 10) || 100;

    const tickets = await Ticket.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    logger.info("admin.tickets_fetched", { count: tickets.length });

    return res.status(200).json({ tickets });
  } catch (err) {
    logger.error("admin.tickets_error", { message: err.message });
    return res.status(500).json({
      success: false,
      error: { message: "Failed to fetch tickets" }
    });
  }
}

// ─── Metrics (Ragas) ─────────────────────────────────────────────────────────

/**
 * GET /admin/metrics
 * Reads Ragas evaluation scores from metrics.json.
 * Run `python ragas_eval.py` to generate / refresh the file.
 */
async function getMetrics(req, res) {
  try {
    if (!fs.existsSync(METRICS_FILE)) {
      logger.warn("admin.metrics_not_found", { path: METRICS_FILE });
      return res.status(200).json({
        message: "Ragas metrics not generated yet. Run: python ragas_eval.py"
      });
    }

    const raw = fs.readFileSync(METRICS_FILE, "utf8");
    const metrics = JSON.parse(raw);

    logger.info("admin.metrics_fetched", { evaluated_at: metrics.evaluated_at });
    return res.status(200).json(metrics);
  } catch (err) {
    logger.error("admin.metrics_error", { message: err.message });
    return res.status(500).json({
      success: false,
      error: { message: "Failed to read metrics file" }
    });
  }
}

// ─── Interactions (bonus: raw log for Ragas export) ──────────────────────────

/**
 * GET /admin/interactions
 * Returns recent interactions (most recent first).
 * Useful for feeding data into the Ragas Python pipeline.
 *
 * Optional query params:
 *   ?limit=50  (default 100)
 *   ?route=rag_agent|action_agent
 */
async function getInteractions(req, res) {
  try {
    const filter = {};

    if (req.query.route === "rag_agent" || req.query.route === "action_agent") {
      filter.route = req.query.route;
    }

    const limit = parseInt(req.query.limit, 10) || 100;

    const interactions = await Interaction.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    logger.info("admin.interactions_fetched", { count: interactions.length });

    return res.status(200).json({ interactions });
  } catch (err) {
    logger.error("admin.interactions_error", { message: err.message });
    return res.status(500).json({
      success: false,
      error: { message: "Failed to fetch interactions" }
    });
  }
}

module.exports = {
  runIngest,
  getAnalytics,
  getTickets,
  getMetrics,
  getInteractions
};
