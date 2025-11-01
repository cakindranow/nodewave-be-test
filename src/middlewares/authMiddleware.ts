import { BadRequestWithMessage } from "$entities/Service";
import { verifyToken } from "$utils/jwt.utils";
import { handleServiceErrorWithResponse } from "$utils/response.utils";
import { Request, Response, NextFunction } from "express";
import  { JwtPayload } from "jsonwebtoken";

export interface AuthRequest extends Request {
    user?: JwtPayload | string;
}

export const authJWT = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return handleServiceErrorWithResponse(res, BadRequestWithMessage("Unauthorized: No token provided"))
        }

        const token = authHeader.split(" ")[1];
        const decoded = verifyToken(token);
        req.user = decoded;

        next();
    } catch (error) {
        return handleServiceErrorWithResponse(res, BadRequestWithMessage("Unauthorized: Invalid or expired token"))
    }
};
