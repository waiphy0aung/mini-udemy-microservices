import { Request, Response, NextFunction } from "express";
import ApiError from "../utils/ApiError";

export default function notFound(
  _req: Request,
  _res: Response,
  next: NextFunction
) {
  next(new ApiError(404, "Route not found"));
}
