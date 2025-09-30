import { Request, Response, NextFunction } from "express";
import config from "../config";
import ApiError from "../utils/ApiError";
import { logger } from "../config/logger";

export const errorConverter = (
  err: any,
  _req: Request,
  _res: Response,
  next: NextFunction
) => {
  let error = err;

  if (!(err instanceof ApiError)) {
    const statusCode = err.statusCode || err.status || 500;
    const message = err.message || "Error"
    error = new ApiError(statusCode, message, false, err.stack)
  }

  if (error.name === "ValidationError" && !error.statusCode) {
    error = new ApiError(
      422,
      error.message,
      true,
      err.stack
    )
  }

  next(error);
}

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  logger.error({ statusCode, message, stack: err.stack });

  const payload = {
    status: "error",
    code: statusCode,
    message,
    ...(config.env === "development" && { stack: err.stack })
  };

  res.status(statusCode).json(payload);
}
