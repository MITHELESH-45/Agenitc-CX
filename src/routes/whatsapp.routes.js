const express = require("express");
const whatsappController = require("../controllers/whatsapp.controller");

const router = express.Router();

router.post("/whatsapp", whatsappController.postWhatsApp);

module.exports = router;
