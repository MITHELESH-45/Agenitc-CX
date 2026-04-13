const express = require("express");
const adminController = require("../controllers/admin.controller");

const router = express.Router();

router.get("/ingest", adminController.runIngest);

module.exports = router;

