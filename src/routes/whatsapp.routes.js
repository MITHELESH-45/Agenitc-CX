const express = require("express");
const whatsappController = require("../controllers/whatsapp.controller");

const router = express.Router();

// Twilio WhatsApp Sandbox sends application/x-www-form-urlencoded POSTs here.
router.post("/whatsapp", whatsappController.postWhatsApp);

module.exports = router;
