import { Request, Response, NextFunction } from "express";
import config from "../config";
import { logger } from "../config/logger";

export default function responseEnvelope(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  res.success = (data: unknown = null, message = "OK", code = 200) => {
    if (config.env === "development") logger.info(message)
    return res.status(code).json({
      status: "success",
      code,
      message,
      data
    })
  }
  next();
}
