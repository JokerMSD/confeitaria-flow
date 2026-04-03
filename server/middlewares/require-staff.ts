import type { NextFunction, Request, Response } from "express";

export function requireStaff(req: Request, res: Response, next: NextFunction) {
  const role = req.session?.user?.role;

  if (role === "admin" || role === "operador") {
    return next();
  }

  return res.status(403).json({
    message: "Staff access required.",
  });
}
