import type { NextFunction, Request, Response } from "express";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (req.session?.user) {
    return next();
  }

  return res.status(401).json({
    message: "Authentication required.",
  });
}
