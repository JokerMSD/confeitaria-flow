import assert from "node:assert/strict";
import test from "node:test";
import {
  getAllowedOrigins,
  getKeepAliveIntervalMs,
  getKeepAliveTimeoutMs,
  getKeepAliveUrl,
  getPublicAppOrigin,
  isKeepAliveEnabled,
} from "../../server/config";

test("config combines CORS and app origins without duplicates", () => {
  const originalCorsOrigins = process.env.CORS_ORIGINS;
  const originalAppOrigin = process.env.APP_ORIGIN;
  const originalViteAppOrigin = process.env.VITE_APP_ORIGIN;

  process.env.CORS_ORIGINS =
    "https://confeitaria-flow.onrender.com, https://confeitaria-flow.vercel.app";
  process.env.APP_ORIGIN = "https://confeitaria-flow.vercel.app";
  process.env.VITE_APP_ORIGIN = "https://confeitaria-flow.vercel.app";

  try {
    assert.deepEqual(getAllowedOrigins(), [
      "https://confeitaria-flow.onrender.com",
      "https://confeitaria-flow.vercel.app",
    ]);
  } finally {
    process.env.CORS_ORIGINS = originalCorsOrigins;
    process.env.APP_ORIGIN = originalAppOrigin;
    process.env.VITE_APP_ORIGIN = originalViteAppOrigin;
  }
});

test("config prefers app origin when generating public links", () => {
  const originalAppOrigin = process.env.APP_ORIGIN;
  const originalViteAppOrigin = process.env.VITE_APP_ORIGIN;

  process.env.APP_ORIGIN = "https://confeitaria-flow.vercel.app";
  process.env.VITE_APP_ORIGIN = "https://fallback.example.com";

  try {
    assert.equal(
      getPublicAppOrigin(),
      "https://confeitaria-flow.vercel.app",
    );
  } finally {
    process.env.APP_ORIGIN = originalAppOrigin;
    process.env.VITE_APP_ORIGIN = originalViteAppOrigin;
  }
});

test("config builds keepalive url from api origin when only origin is configured", () => {
  const originalKeepAliveUrl = process.env.RENDER_KEEPALIVE_URL;
  const originalApiPublicOrigin = process.env.API_PUBLIC_ORIGIN;

  process.env.RENDER_KEEPALIVE_URL = "";
  process.env.API_PUBLIC_ORIGIN = "https://confeitaria-flow.onrender.com";

  try {
    assert.equal(
      getKeepAliveUrl(),
      "https://confeitaria-flow.onrender.com/api/health",
    );
  } finally {
    process.env.RENDER_KEEPALIVE_URL = originalKeepAliveUrl;
    process.env.API_PUBLIC_ORIGIN = originalApiPublicOrigin;
  }
});

test("config keeps explicit keepalive health endpoint and parses toggles safely", () => {
  const originalKeepAliveUrl = process.env.RENDER_KEEPALIVE_URL;
  const originalKeepAliveEnabled = process.env.RENDER_KEEPALIVE_ENABLED;
  const originalKeepAliveInterval = process.env.RENDER_KEEPALIVE_INTERVAL_MS;
  const originalKeepAliveTimeout = process.env.RENDER_KEEPALIVE_TIMEOUT_MS;

  process.env.RENDER_KEEPALIVE_URL =
    "https://confeitaria-flow.onrender.com/api/health";
  process.env.RENDER_KEEPALIVE_ENABLED = "true";
  process.env.RENDER_KEEPALIVE_INTERVAL_MS = "899000";
  process.env.RENDER_KEEPALIVE_TIMEOUT_MS = "4500";

  try {
    assert.equal(
      getKeepAliveUrl(),
      "https://confeitaria-flow.onrender.com/api/health",
    );
    assert.equal(isKeepAliveEnabled(), true);
    assert.equal(getKeepAliveIntervalMs(), 899000);
    assert.equal(getKeepAliveTimeoutMs(), 4500);
  } finally {
    process.env.RENDER_KEEPALIVE_URL = originalKeepAliveUrl;
    process.env.RENDER_KEEPALIVE_ENABLED = originalKeepAliveEnabled;
    process.env.RENDER_KEEPALIVE_INTERVAL_MS = originalKeepAliveInterval;
    process.env.RENDER_KEEPALIVE_TIMEOUT_MS = originalKeepAliveTimeout;
  }
});
