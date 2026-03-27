import type { NextFunction, Request, Response } from "express";

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  if (res.headersSent) {
    return next(err);
  }

  return res.status(status).json({ message });
}
