import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { INTERNAL_SERVER_ERROR_SERVICE_RESPONSE, ServiceResponse } from "$entities/Service";
import Logger from '$pkg/logger';
import { generateToken } from "$utils/jwt.utils";

const prisma = new PrismaClient();

export class AuthService {
    static async login(email: string, password: string): Promise<ServiceResponse<{}>> {
        try {
            // Find user by email
            const user = await prisma.user.findUnique({
                where: { email },
            });

            if (!user) {
                Logger.debug("AuthService.login : email not found")
                return {
                    status: false,
                    data: {},
                    err: {
                        message: "Email not found",
                        code: 401
                    }
                }
            }

            // Validate password
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                Logger.debug("Authcontoller.login : invalid email or password")
                return {
                    status: false,
                    data: {},
                    err: {
                        message: "Invalid email or password",
                        code: 400
                    }
                }
            }

            // Generate token
            const token = generateToken({id: String(user.id),email: user.email,role: user.role});

            return {
                status: true,
                data: {
                    token: token,
                }
            };
        } catch (error) {
            Logger.error(`AuthController.login : ${error}`)
            return INTERNAL_SERVER_ERROR_SERVICE_RESPONSE
        }


    }
}
