const mongoose = require("mongoose");
const Order = require("../db/models/order.model");

async function handleAction({ intent, entities, userId }) {
  if (intent !== "order_status") {
    return {
      ok: false,
      type: "unsupported_action",
      message: "I can only help with order status in this version."
    };
  }

  const orderId = entities && entities.order_id ? String(entities.order_id).trim() : "";
  if (!orderId) {
    return {
      ok: false,
      type: "missing_order_id",
      message: "Please share your order id (e.g. 1234) so I can look it up."
    };
  }

  if (mongoose.connection.readyState !== 1) {
    return {
      ok: false,
      type: "mongo_unavailable",
      message: "Order lookup is temporarily unavailable (MongoDB not connected). Please try again shortly."
    };
  }

  const order = await Order.findOne({ order_id: orderId, userId }).lean();
  if (!order) {
    return {
      ok: false,
      type: "order_not_found",
      message: `I couldn't find order ${orderId} for your account. Please double-check the order id.`
    };
  }

  return {
    ok: true,
    type: "order_status",
    order_id: order.order_id,
    status: order.status
  };
}

module.exports = {
  handleAction
};

