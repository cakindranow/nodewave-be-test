import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";

const secret = process.env.JWT_SECRET as string;
const expiresIn = (process.env.JWT_EXPIRES || "1d") as SignOptions["expiresIn"];

export interface TokenPayload extends JwtPayload {
  id: string;
  email: string;
  role: string;
}

export const generateToken = (payload: TokenPayload) => {
  return jwt.sign(payload, secret, { expiresIn });
};

export const verifyToken = (token: string): TokenPayload => {
  return jwt.verify(token, secret) as TokenPayload;
};