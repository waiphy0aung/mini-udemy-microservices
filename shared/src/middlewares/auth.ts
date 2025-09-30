import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken"
import { JwtPayload } from "../types"
import config from "../config"
import ApiError from "../utils/ApiError";

export const signAccessToken = (
  payload: Pick<JwtPayload, 'id' | 'email'> & Partial<Pick<JwtPayload, 'role'>>
) => jwt.sign(payload as any, config.jwt.secret, { expiresIn: config.jwt.expiresIn ?? '1d' });

export const verifyAccessToken = (token: string): JwtPayload => {
  return jwt.verify(token, config.jwt.secret) as JwtPayload;
}

export const signRefreshToken = (
  payload: Pick<JwtPayload, 'id' | 'email'> & Partial<Pick<JwtPayload, 'role'>>
) => jwt.sign(payload as any, (config.jwt as any).refresh?.secret || config.jwt.secret, { expiresIn: (config.jwt as any).refresh?.expiresIn || '30d' });

export const verifyRefreshToken = (token: string): JwtPayload => {
  return jwt.verify(token, (config.jwt as any).refresh?.secret || config.jwt.secret) as JwtPayload;
}

// Backwards compatibility alias
export const signToken = signAccessToken;

export const verifyToken = verifyAccessToken;

const extractToken = (req: Request): string | undefined => {
  const auth = req.headers.authorization || req.headers.Authorization;
  if (auth && typeof auth === "string" && auth.startsWith("Bearer ")) {
    return auth.slice(7);
  }
  const method = (req.method || "").toUpperCase();
  const isSafe = ["GET", "POST", "PUT", "HEAD", "OPTIONS"].includes(method)
  if (isSafe) return (req as any).cookies?.token;
  return undefined;
}

export const auth = (roles: string[] = []) => async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const token = extractToken(req);
    if (!token) throw ApiError.unauthorized("Missing token");

    const payload = verifyToken(token)

    if (roles.length && !roles.includes(payload.role)) {
      throw ApiError.forbidden("Insufficient permissions");
    }

    (req as any).user = payload
    next();
  } catch (err) {
    const e: any = err;
    if (e.name === "JsonWebTokenError" || e.name === "TokenExpiredError") {
      return next(ApiError.unauthorized("Invalid or expired token"));
    }
    next(err as any);
  }
}
