import { Request, Response, NextFunction } from "express";
import { v4 as uuid } from "uuid";

export default function requestId(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  (req as any).id = (req.headers["x-request-id"] as string) || uuid();
  next();
}
