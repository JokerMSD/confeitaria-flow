import type { NextFunction, Request, Response } from "express";
import { getAllowedOrigins } from "../config";

const allowedOrigins = new Set(getAllowedOrigins());

export function corsMiddleware(req: Request, res: Response, next: NextFunction) {
  const origin = req.headers.origin;

  if (origin && allowedOrigins.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET,POST,PUT,DELETE,OPTIONS",
    );
    res.setHeader("Vary", "Origin");
  }

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  return next();
}
