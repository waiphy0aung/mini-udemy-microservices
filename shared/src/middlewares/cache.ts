import type { Request, Response, NextFunction } from "express";
import { cacheKey, getJSON, setJSON } from "../utils/cache";
import { logger } from "../config/logger";

type CacheOptions = {
  prefix?: string;
  ttl?: number;
  varyByUser?: boolean;
  keyFn?: (req: Request) => string;
};

export default function cache({
  prefix = "http",
  ttl = 60,
  varyByUser = false,
  keyFn
}: CacheOptions = {}) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (req.method !== "GET") return next();
      if (req.headers["x-bypass-cache"] === "1") return next();

      const userId =
        varyByUser && (req as any).user ? (req as any).user.id : "";
      const key = keyFn
        ? keyFn(req)
        : cacheKey({ prefix, path: req.path, query: req.query || {}, userId });

      const hit = await getJSON(key);
      if (hit) {
        return res.status(hit.code || 200).json(hit);
      }

      res.success = (data: unknown = null, message = "OK", code = 200) => {
        const payload = { status: "success", code, message, data };
        setJSON(key, payload, ttl).catch((e) =>
          logger.warn({ msg: "cache set failed", key, err: e.message }),
        );
        return res.status(code).json(payload);
      };

      return next();
    } catch (e) {
      return next();
    }
  }
}
