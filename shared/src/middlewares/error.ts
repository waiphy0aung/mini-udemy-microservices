import { Request, Response, NextFunction } from "express";
import config from "../config";
import ApiError from "../utils/ApiError";
import { logger } from "../config/logger";

function formatStack(stack: string, limit = 5) {
  return stack.split('\n').slice(0, limit + 1).join('\n'); // +1 keeps the error message line
}

export const errorConverter = (
  err: any,
  _req: Request,
  _res: Response,
  next: NextFunction
) => {
  let error = err;
  const formattedStack = formatStack(err.stack)

  if (!(err instanceof ApiError)) {
    const statusCode = err.statusCode || err.status || 500;
    const message = err.message || "Error"
    error = new ApiError(statusCode, message, false, formattedStack)
  }

  if (error.name === "ValidationError" && !error.statusCode) {
    error = new ApiError(
      422,
      error.message,
      true,
      formattedStack
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
  const formattedStack = formatStack(err.stack)

  logger.error({ statusCode, message, stack: formattedStack });

  const payload = {
    status: "error",
    code: statusCode,
    message,
    ...(config.env === "development" && { stack: formattedStack })
  };

  res.status(statusCode).json(payload);
}
