const fs = require("fs");
const path = require("path");
const logger = require("../utils/logger");
const { ingestRag } = require("../rag/ingest.lib");
const Interaction = require("../db/models/interaction.model");
const Ticket = require("../db/models/ticket.model");

// Path to the metrics.json file written by ragas_eval.py
const METRICS_FILE = path.resolve(__dirname, "..", "..", "metrics.json");


let ingestInFlight = null;

function isAuthorized(req) {
  const secret = process.env.ADMIN_SECRET;
  const key = typeof req.query.key === "string" ? req.query.key : "";
  return Boolean(secret && key && key === secret);
}

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
