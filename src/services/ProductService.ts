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
}