const express = require("express");
const adminController = require("../controllers/admin.controller");

const router = express.Router();

router.get("/ingest", adminController.runIngest);

router.get("/analytics", adminController.getAnalytics);

router.get("/tickets", adminController.getTickets);

router.get("/metrics", adminController.getMetrics);

router.get("/interactions", adminController.getInteractions);

module.exports = router;
