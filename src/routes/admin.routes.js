const express = require("express");
const adminController = require("../controllers/admin.controller");

const router = express.Router();

// ── Existing ──────────────────────────────────────────────────────────────────
// GET /admin/ingest?key=<ADMIN_SECRET>
router.get("/ingest", adminController.runIngest);

// ── Analytics ─────────────────────────────────────────────────────────────────
// GET /admin/analytics
router.get("/analytics", adminController.getAnalytics);

// ── Tickets ───────────────────────────────────────────────────────────────────
// GET /admin/tickets[?status=open|resolved][&limit=50]
router.get("/tickets", adminController.getTickets);

// ── Ragas Metrics (placeholder) ───────────────────────────────────────────────
// GET /admin/metrics
router.get("/metrics", adminController.getMetrics);

// ── Raw Interactions (for Ragas export) ──────────────────────────────────────
// GET /admin/interactions[?route=rag_agent|action_agent][&limit=50]
router.get("/interactions", adminController.getInteractions);

module.exports = router;
