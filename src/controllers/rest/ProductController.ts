import { Request, Response } from "express";
import { v4 as uuid } from "uuid";
import { handleServiceErrorWithResponse, response_success } from "$utils/response.utils";
import { BadRequestWithMessage, INTERNAL_SERVER_ERROR_SERVICE_RESPONSE } from "$entities/Service";
import { parseExcel } from "$utils/excel.utils";
import { ProductService } from "$services/ProductService";

export class ProductController {
  static async uploadExcel(req: Request, res: Response) {
    try {
      if (!req.file) {
        return handleServiceErrorWithResponse(res, BadRequestWithMessage("No file uploaded"));
      }

      const requestID = uuid();
      const rows = parseExcel(req.file.path) as Record<string, any>[];
      const totalRows = rows.length;

      await ProductService.createUploadRecord(requestID, totalRows);
      await ProductService.queueProductJobs(requestID, rows);

      return response_success(res, {
        message: `File uploaded successfully. Processing ${totalRows} products in the background...`,
        requestID,
        totalRows,
      });

    } catch (error: any) {
      console.error("Upload Excel Error:", error);
      return handleServiceErrorWithResponse(res, INTERNAL_SERVER_ERROR_SERVICE_RESPONSE)
    }
  }
}
