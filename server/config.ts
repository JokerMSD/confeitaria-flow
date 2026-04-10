export function getAllowedOrigins() {
  const rawOrigins = [
    process.env.CORS_ORIGINS,
    process.env.APP_ORIGIN,
    process.env.VITE_APP_ORIGIN,
  ]
    .filter(Boolean)
    .join(",");

  const normalizedOrigins = (rawOrigins || "http://localhost:3000")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return Array.from(new Set(normalizedOrigins));
}

export function getPublicAppOrigin() {
  const explicitOrigin =
    process.env.APP_ORIGIN?.trim() || process.env.VITE_APP_ORIGIN?.trim();

  if (explicitOrigin) {
    return explicitOrigin;
  }

  return getAllowedOrigins()[0] ?? "http://localhost:3000";
}

export function getBotApiToken() {
  return process.env.BOT_API_TOKEN?.trim() || null;
}

export function getWhatsAppVerifyToken() {
  return process.env.WHATSAPP_VERIFY_TOKEN?.trim() || null;
}

export function getN8nWhatsAppWebhookUrl() {
  return process.env.N8N_WHATSAPP_WEBHOOK_URL?.trim() || null;
}

export function getN8nForwardTimeoutMs() {
  const parsed = Number(process.env.N8N_WHATSAPP_WEBHOOK_TIMEOUT_MS ?? "4000");
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 4000;
}

export function isWhatsAppWebhookDebugEnabled() {
  return process.env.WHATSAPP_WEBHOOK_DEBUG === "true";
}

export function getSessionSecret() {
  const secret = process.env.SESSION_SECRET?.trim();

  if (secret) {
    return secret;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET is required in production.");
  }

  return "confeitaria-flow-dev-session-secret";
}
