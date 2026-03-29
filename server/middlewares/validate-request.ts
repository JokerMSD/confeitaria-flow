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

    if (target === "body") {
      req.body = parsed.data;
      return next();
    }

    const currentTarget = req[target] as Record<string, unknown>;

    for (const key of Object.keys(currentTarget)) {
      delete currentTarget[key];
    }

    Object.assign(currentTarget, parsed.data);
    return next();
  };
}
