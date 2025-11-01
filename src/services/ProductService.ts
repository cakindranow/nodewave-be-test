import Logger from "$pkg/logger";
import { getChannel } from "$server/rabbitmq";
import { prisma } from "$utils/prisma.utils";

export class ProductService {
  static async createUploadRecord(requestID: string, totalRows: number) {
    return prisma.uploadFile.create({
      data: {
        requestID,
        status: "IN_PROGRESS",
        totalRows,
        processedRows: 0,
        createdAt: Math.floor(Date.now() / 1000),
        updatedAt: Math.floor(Date.now() / 1000),
      },
    });
  }

  static async queueProductJobs(requestID: string, rows: Record<string, any>[]) {
    Logger.debug("ProductService.queueProductJobs : Processing product jobs mq")
    const channel = getChannel();
    const queue = "excel_jobs";

    await channel.assertQueue(queue);

    rows.forEach((row) => {
      const data = row as Record<string, any>;

      channel.sendToQueue(
        queue,
        Buffer.from(
          JSON.stringify({
            requestID,
            ...data
          })
        )
      );
    });
  }

    static async processImportedProduct(message: any, ack: () => void, nack: (requeue?: boolean) => void) {
    const { requestID, retryCount = 0, ...productData } = message;

    try {
      // ✅ Basic validation
      if (!productData.name || isNaN(Number(productData.price))) {
        console.warn("⚠️ Invalid row skipped:", productData);

        await prisma.uploadFile.update({
          where: { requestID },
          data: {
            processedRows: { increment: 1 },
            updatedAt: Math.floor(Date.now() / 1000),
          },
        });

        return ack();
      }

      // ✅ Insert product
      await prisma.product.create({
        data: {
          name: String(productData.name),
          description: productData.description ?? null,
          price: Number(productData.price),
          stock: Number(productData.stock ?? 0),
          createdAt: Math.floor(Date.now() / 1000),
        },
      });

      // ✅ Update upload progress
      const upload = await prisma.uploadFile.update({
        where: { requestID },
        data: {
          processedRows: { increment: 1 },
          updatedAt: Math.floor(Date.now() / 1000),
        },
      });

      if (upload.processedRows === upload.totalRows) {
        await prisma.uploadFile.update({
          where: { requestID },
          data: { status: "DONE" },
        });

        console.log(`🎉 Import finished: ${requestID}`);
      }

      console.log(`✅ Imported product: ${productData.name}`);
      return ack();

    } catch (err: any) {
      console.error(`❌ Import error: ${err.message}`);

      const maxRetry = 3;
      if ((retryCount ?? 0) < maxRetry) {
        console.log(`🔁 Retrying (${retryCount + 1}/${maxRetry}) for request: ${requestID}`);
        return nack(true); // requeue
      }

      console.log(`💀 Max retries reached. Sending to FAILED: ${requestID}`);

      await prisma.uploadFile.update({
        where: { requestID },
        data: { status: "FAILED", error: err.message },
      });

      return nack(false); // don't requeue (dead queue)
    }
  }
}