export function getAllowedOrigins() {
  const rawOrigins =
    process.env.CORS_ORIGINS || process.env.APP_ORIGIN || "http://localhost:3000";

  return rawOrigins
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
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
