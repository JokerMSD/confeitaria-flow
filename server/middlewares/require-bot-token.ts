import type { Request, Response, NextFunction } from "express";
import { getBotApiToken } from "../config";
import { HttpError } from "../utils/http-error";

function extractBearerToken(value?: string | null) {
  if (!value) {
    return null;
  }

  const match = value.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}

export function requireBotToken(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  const configuredToken = getBotApiToken();

  if (!configuredToken) {
    next(new HttpError(503, "A integracao do bot nao esta configurada."));
    return;
  }

  const providedToken =
    extractBearerToken(req.headers.authorization) ||
    (typeof req.headers["x-bot-token"] === "string"
      ? req.headers["x-bot-token"].trim()
      : null);

  if (providedToken !== configuredToken) {
    next(new HttpError(401, "Autenticacao do bot obrigatoria."));
    return;
  }

  next();
}
