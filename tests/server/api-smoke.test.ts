import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import type { AddressInfo } from "node:net";
import { createServer, type Server } from "node:http";
import { registerHealthRoutes } from "../../server/modules/health/health.routes";
import { registerAuthRoutes } from "../../server/modules/auth/auth.routes";
import { registerOrdersRoutes } from "../../server/modules/orders/orders.routes";
import { requireAuth } from "../../server/middlewares/require-auth";
import { errorHandler } from "../../server/middlewares/error-handler";

function buildTestApp() {
  process.env.AUTH_USERS_JSON = JSON.stringify([
    {
      email: "admin@docegestao.com",
      password: "admin123",
      name: "Admin",
    },
  ]);

  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use((req, _res, next) => {
    const session = {
      user: undefined as unknown,
      regenerate(callback: (error: Error | null) => void) {
        this.user = undefined;
        callback(null);
      },
      save(callback: (error: Error | null) => void) {
        callback(null);
      },
      destroy(callback: (error: Error | null) => void) {
        this.user = undefined;
        callback(null);
      },
    };

    (req as any).session = session;
    next();
  });

  registerHealthRoutes(app);
  registerAuthRoutes(app);
  app.use("/api", requireAuth);
  registerOrdersRoutes(app);
  app.use(errorHandler);

  return app;
}

async function withServer(
  run: (baseUrl: string) => Promise<void>,
) {
  const app = buildTestApp();
  const server = createServer(app);

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));

  const address = server.address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    await run(baseUrl);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
  }
}

async function readJson(response: Response) {
  return (await response.json()) as Record<string, unknown>;
}

test("GET /api/health responds with ok payload", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/health`);
    const body = await readJson(response);

    assert.equal(response.status, 200);
    assert.equal(body.status, "ok");
    assert.equal(typeof body.timestamp, "string");
  });
});

test("POST /api/auth/login rejects malformed payload with 400 instead of 500", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({}),
    });
    const body = await readJson(response);

    assert.equal(response.status, 400);
    assert.equal(body.message, "Invalid request payload.");
  });
});

test("POST /api/auth/login rejects invalid credentials with 401", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        data: {
          email: "admin@docegestao.com",
          password: "senha-errada",
        },
      }),
    });
    const body = await readJson(response);

    assert.equal(response.status, 401);
    assert.equal(body.message, "Invalid email or password.");
  });
});

test("POST /api/auth/login accepts valid credentials", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        data: {
          email: "admin@docegestao.com",
          password: "admin123",
        },
      }),
    });
    const body = await readJson(response);

    assert.equal(response.status, 200);
    assert.deepEqual(body, {
      data: {
        email: "admin@docegestao.com",
        name: "Admin",
      },
    });
  });
});

test("GET /api/orders returns 401 without authenticated session", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/orders`);
    const body = await readJson(response);

    assert.equal(response.status, 401);
    assert.equal(body.message, "Authentication required.");
  });
});

test("GET /api/orders/queue returns 401 without authenticated session", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/orders/queue`);
    const body = await readJson(response);

    assert.equal(response.status, 401);
    assert.equal(body.message, "Authentication required.");
  });
});
