require("dotenv").config();

const { connectMongo } = require("./mongo");
const Order = require("./models/order.model");
const logger = require("../utils/logger");

async function seed() {
  await connectMongo();

  const order = {
    order_id: "1234",
    status: "Out for delivery",
    userId: "user_1"
  };

  await Order.updateOne(
    { order_id: order.order_id, userId: order.userId },
    { $set: order },
    { upsert: true }
  );

  logger.info("Seed complete", { order_id: order.order_id, userId: order.userId });
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    logger.error(err);
    process.exit(1);
  });

