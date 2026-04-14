const mongoose = require("mongoose");

/**
 * Ticket Model
 * Created automatically when a user's sentiment is "angry"
 * or when an action agent fails. Used for escalation tracking.
 */
const TicketSchema = new mongoose.Schema(
  {
    user: { type: String, required: true, index: true },
    message: { type: String, required: true },
    intent: { type: String, default: "" },
    sentiment: {
      type: String,
      enum: ["neutral", "frustrated", "angry"],
      default: "neutral"
    },
    status: {
      type: String,
      enum: ["open", "resolved"],
      default: "open",
      index: true
    },
    escalated: { type: Boolean, default: false, index: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Ticket", TicketSchema);
