const mongoose = require("mongoose");

/**
 * Interaction Model
 * Stores every user ↔ AI exchange for analytics and Ragas evaluation.
 */
const InteractionSchema = new mongoose.Schema(
  {
    user: { type: String, required: true, index: true },
    question: { type: String, required: true },
    answer: { type: String, required: true },
    context: { type: [String], default: [] },
    route: {
      type: String,
      enum: ["rag_agent", "action_agent", "shortcut"],
      default: "rag_agent",
      index: true
    },
    intent: { type: String, default: "" },
    sentiment: {
      type: String,
      enum: ["neutral", "frustrated", "angry"],
      default: "neutral"
    },
    responseTime: { type: Number, default: 0 } // ms — BONUS field
  },
  { timestamps: true }
);

module.exports = mongoose.model("Interaction", InteractionSchema);
