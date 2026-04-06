import assert from "node:assert/strict";
import test from "node:test";
import { getAllowedOrigins } from "../../server/config";

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
