import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import type { AddressInfo } from "node:net";
import { createServer, type Server } from "node:http";
import { registerHealthRoutes } from "../../server/modules/health/health.routes";
import { registerAuthRoutes } from "../../server/modules/auth/auth.routes";
import { registerBotRoutes } from "../../server/modules/bot/bot.routes";
import { registerOrdersRoutes } from "../../server/modules/orders/orders.routes";
import { registerTtsRoutes } from "../../server/modules/tts/tts.routes";
import { registerWhatsAppWebhookRoutes } from "../../server/modules/whatsapp-webhook/whatsapp-webhook.routes";
import { requireAuth } from "../../server/middlewares/require-auth";
import { errorHandler } from "../../server/middlewares/error-handler";
import { TtsService } from "../../server/services/tts.service";

function buildTestApp() {
  process.env.AUTH_USERS_JSON = JSON.stringify([
    {
      email: "admin@docegestao.com",
      password: "admin123",
      name: "Admin",
    },
  ]);
  process.env.BOT_API_TOKEN = "test-bot-token";
  process.env.WHATSAPP_VERIFY_TOKEN = "test-whatsapp-token";
  process.env.N8N_WHATSAPP_WEBHOOK_URL = "https://n8n.example.com/webhook/whatsapp";

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
  registerWhatsAppWebhookRoutes(app);
  registerAuthRoutes(app);
  registerBotRoutes(app);
  registerTtsRoutes(app);
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
        role: "admin",
        customerId: null,
        photoUrl: null,
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

test("GET /api/orders/dashboard-drilldown returns 401 without authenticated session", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(
      `${baseUrl}/api/orders/dashboard-drilldown?kind=today&dateFrom=2026-04-01&dateTo=2026-04-07`,
    );
    const body = await readJson(response);

    assert.equal(response.status, 401);
    assert.equal(body.message, "Authentication required.");
  });
});

test("GET /api/bot/store-summary returns 401 without bot token", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/bot/store-summary`);
    const body = await readJson(response);

    assert.equal(response.status, 401);
    assert.equal(body.message, "Autenticacao do bot obrigatoria.");
  });
});

test("POST /api/tts/voice-note returns 401 without bot token", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/tts/voice-note`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        text: "ola",
      }),
    });
    const body = await readJson(response);

    assert.equal(response.status, 401);
    assert.equal(body.message, "Autenticacao do bot obrigatoria.");
  });
});

test("POST /api/tts/voice-note returns ogg audio for authenticated bot calls", async () => {
  const originalCreateVoiceNote = TtsService.prototype.createVoiceNote;
  TtsService.prototype.createVoiceNote = async () => ({
    buffer: Buffer.from("fake-ogg-audio"),
    filename: "voice-note.ogg",
  });

  try {
    await withServer(async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/tts/voice-note`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer test-bot-token",
        },
        body: JSON.stringify({
          text: "ola, como posso ajudar?",
        }),
      });
      const body = Buffer.from(await response.arrayBuffer());

      assert.equal(response.status, 200);
      assert.equal(response.headers.get("content-type"), "audio/ogg");
      assert.equal(
        response.headers.get("content-disposition"),
        'inline; filename="voice-note.ogg"',
      );
      assert.deepEqual(body, Buffer.from("fake-ogg-audio"));
    });
  } finally {
    TtsService.prototype.createVoiceNote = originalCreateVoiceNote;
  }
});

test("GET /webhooks/whatsapp returns challenge when verification token is valid", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(
      `${baseUrl}/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=test-whatsapp-token&hub.challenge=abc123`,
    );
    const body = await response.text();

    assert.equal(response.status, 200);
    assert.equal(body, "abc123");
  });
});

test("POST /webhooks/whatsapp ignores status-only payloads", async () => {
  await withServer(async (baseUrl) => {
    const originalFetch = globalThis.fetch;
    let forwarded = false;

    globalThis.fetch = (async (...args: Parameters<typeof fetch>) => {
      const target = String(args[0]);
      if (target.startsWith(baseUrl)) {
        return originalFetch(...args);
      }

      forwarded = true;
      return originalFetch(...args);
    }) as typeof fetch;

    try {
      const response = await fetch(`${baseUrl}/webhooks/whatsapp`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          entry: [
            {
              changes: [
                {
                  value: {
                    statuses: [{ status: "delivered" }],
                  },
                },
              ],
            },
          ],
        }),
      });
      const body = await readJson(response);

      assert.equal(response.status, 200);
      assert.deepEqual(body, { ok: true, forwarded: false });
      assert.equal(forwarded, false);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

test("POST /webhooks/whatsapp forwards user messages to n8n and still returns 200", async () => {
  await withServer(async (baseUrl) => {
    const originalFetch = globalThis.fetch;
    let capturedUrl = "";
    let capturedBody = "";

    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const target = String(input);
      if (target.startsWith(baseUrl)) {
        return originalFetch(input, init);
      }

      capturedUrl = target;
      capturedBody = String(init?.body ?? "");

      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: {
          "content-type": "application/json",
        },
      });
    }) as typeof fetch;

    try {
      const payload = {
        entry: [
          {
            changes: [
              {
                value: {
                  messages: [
                    {
                      from: "5531999990000",
                      type: "text",
                    },
                  ],
                },
              },
            ],
          },
        ],
      };

      const response = await fetch(`${baseUrl}/webhooks/whatsapp`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const body = await readJson(response);

      assert.equal(response.status, 200);
      assert.deepEqual(body, { ok: true, forwarded: true });
      assert.equal(capturedUrl, "https://n8n.example.com/webhook/whatsapp");
      assert.deepEqual(JSON.parse(capturedBody), payload);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
