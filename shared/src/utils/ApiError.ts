export default class ApiError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(
    statusCode: number = 500,
    message: string = "Internal Server Error",
    isOperational: boolean = true,
    stack: string = ""
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    if (stack) this.stack = stack;
    else Error.captureStackTrace(this, this.constructor)
  }

  static badRequest(msg = "Bad Request") {
    return new ApiError(400, msg);
  }

  static unauthorized(msg = "Unauthorized") {
    return new ApiError(401, msg);
  }

  static forbidden(msg = "Forbidden") {
    return new ApiError(403, msg);
  }

  static notFound(msg = "Not Found") {
    return new ApiError(404, msg);
  }
}
