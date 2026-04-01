const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema(
  {
    order_id: { type: String, required: true, index: true },
    status: { type: String, required: true },
    userId: { type: String, required: true, index: true }
  },
  { timestamps: true }
);

OrderSchema.index({ order_id: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model("Order", OrderSchema);

