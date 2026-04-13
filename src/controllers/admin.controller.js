const logger = require("../utils/logger");
const { ingestRag } = require("../rag/ingest.lib");

let ingestInFlight = null;

function isAuthorized(req) {
  const secret = process.env.ADMIN_SECRET;
  const key = typeof req.query.key === "string" ? req.query.key : "";
  return Boolean(secret && key && key === secret);
}

/**
 * GET /admin/ingest?key=...
 * Runs the RAG ingestion pipeline safely.
 *
 * NOTE: We keep HTTP 200 for successful auth. For auth failures return 403.
 * If ingestion is already running, return success with a clear message.
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

module.exports = { runIngest };

