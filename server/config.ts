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

function parsePositiveNumber(rawValue: string | undefined, fallback: number) {
  const parsed = Number(rawValue ?? "");
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function getPublicAppOrigin() {
  const explicitOrigin =
    process.env.APP_ORIGIN?.trim() || process.env.VITE_APP_ORIGIN?.trim();

  if (explicitOrigin) {
    return explicitOrigin;
  }

  return getAllowedOrigins()[0] ?? "http://localhost:3000";
}

export function getKeepAliveUrl() {
  const configured =
    process.env.RENDER_KEEPALIVE_URL?.trim() ||
    process.env.API_PUBLIC_ORIGIN?.trim() ||
    process.env.RENDER_EXTERNAL_URL?.trim() ||
    null;

  if (!configured) {
    return null;
  }

  try {
    const url = new URL(configured);
    if (url.pathname === "/" || url.pathname === "") {
      url.pathname = "/api/health";
    }
    return url.toString();
  } catch {
    return null;
  }
}

export function isKeepAliveEnabled() {
  return process.env.RENDER_KEEPALIVE_ENABLED === "true";
}

export function getKeepAliveIntervalMs() {
  const configured = parsePositiveNumber(
    process.env.RENDER_KEEPALIVE_INTERVAL_MS,
    14 * 60 * 1000,
  );

  return Math.max(60_000, configured);
}

export function getKeepAliveTimeoutMs() {
  const configured = parsePositiveNumber(
    process.env.RENDER_KEEPALIVE_TIMEOUT_MS,
    10_000,
  );

  return Math.max(1_000, configured);
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
  return parsePositiveNumber(process.env.N8N_WHATSAPP_WEBHOOK_TIMEOUT_MS, 4000);
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
