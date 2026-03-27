import type { NextFunction, Request, Response } from "express";
import type { ZodTypeAny } from "zod";

export function validateRequest(
  schema: ZodTypeAny,
  target: "body" | "query" | "params" = "body",
) {
  return (req: Request, res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req[target]);

    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid request payload.",
        issues: parsed.error.issues,
      });
    }

    req[target] = parsed.data;
    return next();
  };
}
