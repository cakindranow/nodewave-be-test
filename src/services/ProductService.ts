import Logger from "$pkg/logger";
import { getChannel } from "$server/rabbitmq";
import { prisma } from "$utils/prisma.utils";
import { FilteringQueryV2, PagedList } from "$entities/Query";
import { ServiceResponse, INTERNAL_SERVER_ERROR_SERVICE_RESPONSE } from "$entities/Service";
import { buildFilterQueryLimitOffsetV2 } from "./helpers/FilterQueryV2";

export class ProductService {

  static async getProducts(query: FilteringQueryV2): Promise<ServiceResponse<PagedList<any>>> {
    Logger.debug("ProductService.getProducts : Fetching products with filters");

    try {
      // Use the helper to build the query
      const { where, orderBy, take, skip } = buildFilterQueryLimitOffsetV2(query);

      // Get total count for pagination
      const totalData = await prisma.product.count({ where });
      const totalPage = Math.ceil(totalData / take);

      // Get filtered and paginated products
      const products = await prisma.product.findMany({
        where,
        orderBy,
        skip,
        take,
      });

      return {
        status: true,
        data: {
          entries: products,
          totalData,
          totalPage,
        }
      };
    } catch (error: any) {
      Logger.error(`Failed to fetch products: ${error.message}`);
      return {
        status: false,
        data: {
          entries: [],
          totalData: 0,
          totalPage: 0
        },
        err: {
          message: `Internal Server Error: ${error.message}`,
          code: 500
        }
      };
    }
  }

  static async getFileUploads(query: FilteringQueryV2): Promise<ServiceResponse<PagedList<any>>> {
    Logger.debug("ProductService.getFileUploads : Fetching file uploads with filters");

    try {
      // Use the helper to build the query
      const { where, orderBy, take, skip } = buildFilterQueryLimitOffsetV2(query);

      // Get total count for pagination
      const totalData = await prisma.uploadFile.count({ where });
      const totalPage = Math.ceil(totalData / take);

      // Get filtered and paginated uploads
      const uploads = await prisma.uploadFile.findMany({
        where,
        orderBy,
        skip,
        take,
      });

      return {
        status: true,
        data: {
          entries: uploads,
          totalData,
          totalPage,
        }
      };
    } catch (error: any) {
      Logger.error(`Failed to fetch file uploads: ${error.message}`);
      return {
        status: false,
        data: {
          entries: [],
          totalData: 0,
          totalPage: 0
        },
        err: {
          message: `Internal Server Error: ${error.message}`,
          code: 500
        }
      };
    }
  }

  static async getFileUploadByRequestID(requestID: string): Promise<ServiceResponse<any>> {
    Logger.debug(`ProductService.getFileUploadByRequestID : Fetching upload record for requestID ${requestID}`);
    
    try {
      const upload = await prisma.uploadFile.findUnique({
        where: { requestID }
      });

      if (!upload) {
        return {
          status: false,
          data: {},
          err: {
            message: `Upload record with requestID ${requestID} not found`,
            code: 404
          }
        };
      }

      return {
        status: true,
        data: upload,
      };
    } catch (error: any) {
      Logger.error(`Failed to fetch upload record: ${error.message}`);
      return INTERNAL_SERVER_ERROR_SERVICE_RESPONSE;
    }
  }

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
        Logger.debug("⚠️ Invalid row skipped:", productData);

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

        Logger.debug(`🎉 Import finished: ${requestID}`);
      }

      Logger.debug(`✅ Imported product: ${productData.name}`);
      return ack();

    } catch (err: any) {
      console.error(`❌ Import error: ${err.message}`);

      const maxRetry = 3;
      if ((retryCount ?? 0) < maxRetry) {
        Logger.debug(`🔁 Retrying (${retryCount + 1}/${maxRetry}) for request: ${requestID}`);
        return nack(true); // requeue
      }

      Logger.debug(`💀 Max retries reached. Sending to FAILED: ${requestID}`);

      await prisma.uploadFile.update({
        where: { requestID },
        data: { status: "FAILED", error: err.message },
      });

      return nack(false); // don't requeue (dead queue)
    }
  }
}