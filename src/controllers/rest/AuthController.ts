import { Request, Response } from 'express';
import { handleServiceErrorWithResponse, response_success } from '$utils/response.utils';
import { AuthService } from '$services/AuthService';
import Logger from '$pkg/logger';

export class AuthController {
static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        Logger.debug("email & password required")
        return res.status(400).json({ message: "Email & password required" }); // manual validation
      }

      const result = await AuthService.login(email, password);

      if (!result.status) {
        return handleServiceErrorWithResponse(res, result)
      }
      return response_success(res, result ,"Successfully login" )

    } catch (error: any) {
      Logger.error(`AuthController.login : ${error}`)
      return res.status(401).json({ message: error.message || "Login failed" });
    }
  }

  static async test(req: Request, res: Response) {
     return response_success(res, "test", "Success!")
  }
}
