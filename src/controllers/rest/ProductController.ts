import { Request, Response } from "express";
import { v4 as uuid } from "uuid";
import { handleServiceErrorWithResponse, response_success } from "$utils/response.utils";
import { BadRequestWithMessage, INTERNAL_SERVER_ERROR_SERVICE_RESPONSE } from "$entities/Service";
import { FilteringQueryV2 } from "$entities/Query";
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

  static async getProducts(req: Request, res: Response) {
    try {
      const {
        page,
        rows,
        orderKey,
        orderRule,
        filters,
        searchFilters,
        minPrice,
        maxPrice,
        minStock,
        maxStock
      } = req.query;

      const query: FilteringQueryV2 = {
        page: page ? Number(page) : 1,
        rows: rows ? Number(rows) : 10,
        orderKey: orderKey as string,
        orderRule: orderRule as string,
        rangedFilters: []
      };

      // Handle filters JSON
      if (filters) {
        try {
          query.filters = JSON.parse(filters as string);
        } catch (error) {
          return handleServiceErrorWithResponse(res, BadRequestWithMessage("Invalid filters JSON format"));
        }
      }

      // Handle search filters
      if (searchFilters) {
        try {
          query.searchFilters = JSON.parse(searchFilters as string);
        } catch (error) {
          return handleServiceErrorWithResponse(res, BadRequestWithMessage("Invalid searchFilters JSON format"));
        }
      }

      // Add price range filter if provided
      if (minPrice || maxPrice) {
        query.rangedFilters!.push({
          key: 'price',
          start: minPrice ? Number(minPrice) : null,
          end: maxPrice ? Number(maxPrice) : null
        });
      }

      // Add stock range filter if provided
      if (minStock || maxStock) {
        query.rangedFilters!.push({
          key: 'stock',
          start: minStock ? Number(minStock) : null,
          end: maxStock ? Number(maxStock) : null
        });
      }

      const result = await ProductService.getProducts(query);
      
      if (!result.status) {
        return handleServiceErrorWithResponse(res, result);
      }

      return response_success(res, result.data);
    } catch (error: any) {
      console.error("Get Products Error:", error);
      return handleServiceErrorWithResponse(res, INTERNAL_SERVER_ERROR_SERVICE_RESPONSE)
    }
}

  static async getFileUploads(req: Request, res: Response) {
    try {
      const {
        page,
        rows,
        orderKey,
        orderRule,
        filters,
        searchFilters,
        startDate,
        endDate
      } = req.query;

      const query: FilteringQueryV2 = {
        page: page ? Number(page) : 1,
        rows: rows ? Number(rows) : 10,
        orderKey: orderKey as string,
        orderRule: orderRule as string,
        rangedFilters: []
      };

      // Handle filters JSON (for status, requestID, etc)
      if (filters) {
        try {
          query.filters = JSON.parse(filters as string);
        } catch (error) {
          return handleServiceErrorWithResponse(res, BadRequestWithMessage("Invalid filters JSON format"));
        }
      }

      // Handle search filters
      if (searchFilters) {
        try {
          query.searchFilters = JSON.parse(searchFilters as string);
        } catch (error) {
          return handleServiceErrorWithResponse(res, BadRequestWithMessage("Invalid searchFilters JSON format"));
        }
      }

      // Add date range filter if provided
      if (startDate || endDate) {
        query.rangedFilters!.push({
          key: 'createdAt',
          start: startDate ? Number(startDate) : null,
          end: endDate ? Number(endDate) : null
        });
      }

      const result = await ProductService.getFileUploads(query);
      
      if (!result.status) {
        return handleServiceErrorWithResponse(res, result);
      }

      return response_success(res, result.data);
    } catch (error: any) {
      console.error("Get File Uploads Error:", error);
      return handleServiceErrorWithResponse(res, INTERNAL_SERVER_ERROR_SERVICE_RESPONSE)
    }
}  

  static async getFileUploadByRequestID(req: Request, res: Response) {
    try {
      const { requestID } = req.params;
      
      if (!requestID) {
        return handleServiceErrorWithResponse(res, BadRequestWithMessage("RequestID is required"));
      }

      const result = await ProductService.getFileUploadByRequestID(requestID);
      
      if (!result.status) {
        return handleServiceErrorWithResponse(res, result);
      }

      return response_success(res, result.data);
    } catch (error: any) {
      console.error("Get File Upload By RequestID Error:", error);
      return handleServiceErrorWithResponse(res, INTERNAL_SERVER_ERROR_SERVICE_RESPONSE);
    }
}
}
