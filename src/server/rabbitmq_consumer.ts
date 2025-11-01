import "../paths";
import { ProductService } from "$services/ProductService";
import amqp from "amqplib";

const QUEUE = "excel_jobs";

async function startProductConsumer() {
  try {
    const connection = await amqp.connect("amqp://admin:admin@localhost:5672");
    const channel = await connection.createChannel();
    await channel.assertQueue(QUEUE);

    console.log(`🐇 Listening queue: ${QUEUE}`);

    channel.consume(QUEUE, async (msg) => {
      if (!msg) return;

      const message = JSON.parse(msg.content.toString());

      await ProductService.processImportedProduct(
        message,
        () => channel.ack(msg),
        (requeue = false) => channel.nack(msg, false, requeue)
      );
    });
  } catch (error) {
    console.error("❌ Failed to start consumer", error);
  }
}

process.on("SIGINT", () => process.exit(0));
startProductConsumer();
