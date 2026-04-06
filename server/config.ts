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
