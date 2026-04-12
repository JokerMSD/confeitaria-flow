import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import type { AddressInfo } from "node:net";
import { createServer, type Server } from "node:http";
import { registerHealthRoutes } from "../../server/modules/health/health.routes";
import { registerAuthRoutes } from "../../server/modules/auth/auth.routes";
import { registerBotRoutes } from "../../server/modules/bot/bot.routes";
import { registerChatHistoryRoutes } from "../../server/modules/chat-history/chat-history.routes";
import { registerOrdersRoutes } from "../../server/modules/orders/orders.routes";
import { registerTtsRoutes } from "../../server/modules/tts/tts.routes";
import { registerWhatsAppAssistantRoutes } from "../../server/modules/whatsapp-assistant/whatsapp-assistant.routes";
import { registerWhatsAppWebhookRoutes } from "../../server/modules/whatsapp-webhook/whatsapp-webhook.routes";
import { ChatHistoryService } from "../../server/services/chat-history.service";
import { WhatsAppAssistantService } from "../../server/services/whatsapp-assistant.service";
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

  app.use((req, res, next) => {
    if (req.path === "/api/tts/voice-note") {
      next();
      return;
    }

    express.json()(req, res, next);
  });
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
  registerWhatsAppAssistantRoutes(app);
  registerChatHistoryRoutes(app);
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

test("POST /api/chat-history/messages returns 401 without bot token", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/chat-history/messages`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        customerPhone: "553182502353",
        role: "user",
        message: "Oi",
      }),
    });
    const body = await readJson(response);

    assert.equal(response.status, 401);
    assert.equal(body.message, "Autenticacao do bot obrigatoria.");
  });
});

test("GET /api/whatsapp-assistant/catalog returns 401 without bot token", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/whatsapp-assistant/catalog`);
    const body = await readJson(response);

    assert.equal(response.status, 401);
    assert.equal(body.message, "Autenticacao do bot obrigatoria.");
  });
});

test("POST /api/chat-history/messages rejects invalid payloads", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/chat-history/messages`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: "Bearer test-bot-token",
      },
      body: JSON.stringify({
        customerPhone: "553182502353",
        role: "invalid",
        message: "",
      }),
    });
    const body = await readJson(response);

    assert.equal(response.status, 400);
    assert.equal(body.message, "Invalid request payload.");
  });
});

test("chat history routes save messages and return recent context for bot calls", async () => {
  const savedMessages: Array<Record<string, unknown>> = [];
  const originalSaveMessage = ChatHistoryService.prototype.saveMessage;
  const originalGetRecentMessages = ChatHistoryService.prototype.getRecentMessages;
  const originalGetConversationContext = ChatHistoryService.prototype.getConversationContext;

  ChatHistoryService.prototype.saveMessage =
    async function mockSaveMessage(input: any) {
      const item = {
        id: `msg-${savedMessages.length + 1}`,
        customerPhone: input.customerPhone,
        role: input.role,
        message: input.message,
        channel: input.channel ?? "whatsapp",
        metadata: input.metadata ?? null,
        createdAt: "2026-04-11T10:00:00.000Z",
      };
      savedMessages.push(item);
      return item;
    };

  ChatHistoryService.prototype.getRecentMessages =
    async function mockGetRecentMessages(customerPhone: string, limit?: number) {
      return {
        customerPhone,
        messages: savedMessages.slice(0, limit ?? 10).map((message) => ({
          role: message.role as "user" | "assistant" | "system",
          message: String(message.message),
          createdAt: String(message.createdAt),
          channel: String(message.channel),
          metadata: (message.metadata as Record<string, unknown> | null) ?? null,
        })),
      };
    };

  ChatHistoryService.prototype.getConversationContext =
    async function mockGetConversationContext(customerPhone: string) {
      return {
        customerPhone,
        historyText: "Cliente: Oi\nBot: Olá! Como posso ajudar?",
      };
    };

  try {
    await withServer(async (baseUrl) => {
      const createResponse = await fetch(`${baseUrl}/api/chat-history/messages`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer test-bot-token",
        },
        body: JSON.stringify({
          customerPhone: "553182502353",
          role: "user",
          message: "Oi",
          metadata: {
            messageType: "text",
          },
        }),
      });
      const created = await readJson(createResponse);

      assert.equal(createResponse.status, 201);
      assert.equal(created.customerPhone, "553182502353");

      const listResponse = await fetch(
        `${baseUrl}/api/chat-history/553182502353?limit=5`,
        {
          headers: {
            authorization: "Bearer test-bot-token",
          },
        },
      );
      const listed = await readJson(listResponse);

      assert.equal(listResponse.status, 200);
      assert.equal(listed.customerPhone, "553182502353");
      assert.equal(Array.isArray(listed.messages), true);

      const contextResponse = await fetch(
        `${baseUrl}/api/chat-history/553182502353/context?limit=5`,
        {
          headers: {
            authorization: "Bearer test-bot-token",
          },
        },
      );
      const context = await readJson(contextResponse);

      assert.equal(contextResponse.status, 200);
      assert.equal(
        context.historyText,
        "Cliente: Oi\nBot: Olá! Como posso ajudar?",
      );
    });
  } finally {
    ChatHistoryService.prototype.saveMessage = originalSaveMessage;
    ChatHistoryService.prototype.getRecentMessages = originalGetRecentMessages;
    ChatHistoryService.prototype.getConversationContext = originalGetConversationContext;
  }
});

test("whatsapp assistant routes expose customer, draft, orders and session for bot calls", async () => {
  const originalGetCustomerByPhone =
    WhatsAppAssistantService.prototype.getCustomerByPhone;
  const originalUpsertCustomer =
    WhatsAppAssistantService.prototype.upsertCustomer;
  const originalGetCatalog = WhatsAppAssistantService.prototype.getCatalog;
  const originalSearchCatalog = WhatsAppAssistantService.prototype.searchCatalog;
  const originalGetDraftByPhone =
    WhatsAppAssistantService.prototype.getDraftByPhone;
  const originalUpsertDraft = WhatsAppAssistantService.prototype.upsertDraft;
  const originalConfirmDraft = WhatsAppAssistantService.prototype.confirmDraft;
  const originalListOrdersByPhone =
    WhatsAppAssistantService.prototype.listOrdersByPhone;
  const originalGetOrderById = WhatsAppAssistantService.prototype.getOrderById;
  const originalGetSessionStatus =
    WhatsAppAssistantService.prototype.getSessionStatus;

  WhatsAppAssistantService.prototype.getCustomerByPhone = async (phone: string) => ({
    whatsappCustomerId: "wa-1",
    customerId: "cust-1",
    phone,
    name: "Igor Silva",
    email: "igor@email.com",
    address: "Rua A, 100",
    notes: null,
    isActive: true,
    source: "linked",
    lastInteractionAt: "2026-04-12T10:00:00.000Z",
  });
  WhatsAppAssistantService.prototype.upsertCustomer = async (input: any) => ({
    whatsappCustomerId: "wa-1",
    customerId: "cust-1",
    phone: input.phone,
    name: input.name ?? "Igor Silva",
    email: "igor@email.com",
    address: input.address ?? null,
    notes: input.notes ?? null,
    isActive: true,
    source: "linked",
    lastInteractionAt: "2026-04-12T10:00:00.000Z",
  });
  WhatsAppAssistantService.prototype.getCatalog = async () => [
    {
      id: "prod-1",
      name: "Ovo de colher 500g",
      category: "Ovos",
      priceCents: 4990,
      available: true,
      notes: null,
      primaryImageUrl: null,
    },
  ];
  WhatsAppAssistantService.prototype.searchCatalog = async () => [
    {
      id: "prod-1",
      name: "Ovo de colher 500g",
      category: "Ovos",
      priceCents: 4990,
      available: true,
      notes: null,
      primaryImageUrl: null,
    },
  ];
  WhatsAppAssistantService.prototype.getDraftByPhone = async (phone: string) => ({
    id: "draft-1",
    customerPhone: phone,
    whatsappCustomerId: "wa-1",
    customerId: "cust-1",
    productId: "prod-1",
    productName: "Ovo de colher 500g",
    quantity: 2,
    flavor: "Ninho",
    deliveryDate: "2026-04-15",
    deliveryType: "pickup",
    address: null,
    notes: null,
    createdAt: "2026-04-12T10:00:00.000Z",
    updatedAt: "2026-04-12T10:00:00.000Z",
  });
  WhatsAppAssistantService.prototype.upsertDraft = async (input: any) => ({
    id: "draft-1",
    customerPhone: input.customerPhone,
    whatsappCustomerId: "wa-1",
    customerId: "cust-1",
    productId: input.productId ?? null,
    productName: input.productName ?? "Ovo de colher 500g",
    quantity: input.quantity ?? 1,
    flavor: input.flavor ?? null,
    deliveryDate: input.deliveryDate ?? null,
    deliveryType: input.deliveryType ?? null,
    address: input.address ?? null,
    notes: input.notes ?? null,
    createdAt: "2026-04-12T10:00:00.000Z",
    updatedAt: "2026-04-12T10:00:00.000Z",
  });
  WhatsAppAssistantService.prototype.confirmDraft = async () => ({
    orderId: "order-1",
    orderNumber: "PED-000123",
    status: "Novo",
    paymentStatus: "Pendente",
  });
  WhatsAppAssistantService.prototype.listOrdersByPhone = async () => [
    {
      id: "order-1",
      orderNumber: "PED-000123",
      customerName: "Igor Silva",
      orderDate: "2026-04-12",
      deliveryDate: "2026-04-15",
      deliveryTime: null,
      deliveryMode: "Retirada",
      status: "Novo",
      paymentStatus: "Pendente",
      subtotalAmountCents: 4990,
      paidAmountCents: 0,
      remainingAmountCents: 4990,
      itemSummary: "Ovo de colher 500g - Ninho",
    },
  ];
  WhatsAppAssistantService.prototype.getOrderById = async (id: string) => ({
    id,
    orderNumber: "PED-000123",
  });
  WhatsAppAssistantService.prototype.getSessionStatus = async () => ({
    customerExists: true,
    hasDraftOrder: true,
    missingFields: [],
    lastOrderId: "order-1",
  });

  try {
    await withServer(async (baseUrl) => {
      const headers = {
        authorization: "Bearer test-bot-token",
        "content-type": "application/json",
      };

      const customerResponse = await fetch(
        `${baseUrl}/api/whatsapp-assistant/customers/by-phone/553182502353`,
        { headers: { authorization: "Bearer test-bot-token" } },
      );
      const customer = await readJson(customerResponse);
      assert.equal(customerResponse.status, 200);
      assert.equal(customer.phone, "553182502353");

      const upsertCustomerResponse = await fetch(
        `${baseUrl}/api/whatsapp-assistant/customers/upsert`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            phone: "553182502353",
            name: "Igor Silva",
          }),
        },
      );
      assert.equal(upsertCustomerResponse.status, 201);

      const catalogResponse = await fetch(
        `${baseUrl}/api/whatsapp-assistant/catalog`,
        { headers: { authorization: "Bearer test-bot-token" } },
      );
      const catalog = await readJson(catalogResponse);
      assert.equal(catalogResponse.status, 200);
      assert.equal(Array.isArray(catalog), true);

      const searchResponse = await fetch(
        `${baseUrl}/api/whatsapp-assistant/catalog/search?q=ovo`,
        { headers: { authorization: "Bearer test-bot-token" } },
      );
      assert.equal(searchResponse.status, 200);

      const draftResponse = await fetch(
        `${baseUrl}/api/whatsapp-assistant/orders/draft/553182502353`,
        { headers: { authorization: "Bearer test-bot-token" } },
      );
      const draft = await readJson(draftResponse);
      assert.equal(draftResponse.status, 200);
      assert.equal(draft.customerPhone, "553182502353");

      const upsertDraftResponse = await fetch(
        `${baseUrl}/api/whatsapp-assistant/orders/draft/upsert`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            customerPhone: "553182502353",
            productId: "11111111-1111-1111-1111-111111111111",
            quantity: 2,
          }),
        },
      );
      assert.equal(upsertDraftResponse.status, 201);

      const confirmResponse = await fetch(
        `${baseUrl}/api/whatsapp-assistant/orders/draft/confirm`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            customerPhone: "553182502353",
          }),
        },
      );
      const confirmed = await readJson(confirmResponse);
      assert.equal(confirmResponse.status, 200);
      assert.equal(confirmed.orderNumber, "PED-000123");

      const ordersResponse = await fetch(
        `${baseUrl}/api/whatsapp-assistant/orders/by-phone/553182502353`,
        { headers: { authorization: "Bearer test-bot-token" } },
      );
      const orders = await readJson(ordersResponse);
      assert.equal(ordersResponse.status, 200);
      assert.equal(Array.isArray(orders), true);

      const orderDetailResponse = await fetch(
        `${baseUrl}/api/whatsapp-assistant/orders/11111111-1111-1111-1111-111111111111`,
        { headers: { authorization: "Bearer test-bot-token" } },
      );
      const orderDetail = await readJson(orderDetailResponse);
      assert.equal(orderDetailResponse.status, 200);
      assert.equal(orderDetail.id, "11111111-1111-1111-1111-111111111111");

      const sessionResponse = await fetch(
        `${baseUrl}/api/whatsapp-assistant/session/553182502353`,
        { headers: { authorization: "Bearer test-bot-token" } },
      );
      const session = await readJson(sessionResponse);
      assert.equal(sessionResponse.status, 200);
      assert.equal(session.customerExists, true);
    });
  } finally {
    WhatsAppAssistantService.prototype.getCustomerByPhone =
      originalGetCustomerByPhone;
    WhatsAppAssistantService.prototype.upsertCustomer = originalUpsertCustomer;
    WhatsAppAssistantService.prototype.getCatalog = originalGetCatalog;
    WhatsAppAssistantService.prototype.searchCatalog = originalSearchCatalog;
    WhatsAppAssistantService.prototype.getDraftByPhone = originalGetDraftByPhone;
    WhatsAppAssistantService.prototype.upsertDraft = originalUpsertDraft;
    WhatsAppAssistantService.prototype.confirmDraft = originalConfirmDraft;
    WhatsAppAssistantService.prototype.listOrdersByPhone =
      originalListOrdersByPhone;
    WhatsAppAssistantService.prototype.getOrderById = originalGetOrderById;
    WhatsAppAssistantService.prototype.getSessionStatus =
      originalGetSessionStatus;
  }
});

test("GET /api/whatsapp-assistant/customers/by-phone/:phone returns 404 when customer does not exist", async () => {
  const originalGetCustomerByPhone =
    WhatsAppAssistantService.prototype.getCustomerByPhone;

  WhatsAppAssistantService.prototype.getCustomerByPhone = async () => null;

  try {
    await withServer(async (baseUrl) => {
      const response = await fetch(
        `${baseUrl}/api/whatsapp-assistant/customers/by-phone/553182502353`,
        { headers: { authorization: "Bearer test-bot-token" } },
      );
      const body = await readJson(response);

      assert.equal(response.status, 404);
      assert.equal(body.message, "Cliente nao encontrado para este telefone.");
    });
  } finally {
    WhatsAppAssistantService.prototype.getCustomerByPhone =
      originalGetCustomerByPhone;
  }
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

test("POST /api/tts/voice-note accepts plain text bodies", async () => {
  const originalCreateVoiceNote = TtsService.prototype.createVoiceNote;
  let receivedText = "";

  TtsService.prototype.createVoiceNote = async (text: string) => {
    receivedText = text;

    return {
      buffer: Buffer.from("fake-ogg-audio"),
      filename: "voice-note.ogg",
    };
  };

  try {
    await withServer(async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/tts/voice-note`, {
        method: "POST",
        headers: {
          "content-type": "text/plain",
          authorization: "Bearer test-bot-token",
        },
        body: "Ola!\n\nComo posso ajudar hoje?",
      });

      assert.equal(response.status, 200);
      assert.equal(receivedText, "Ola!\n\nComo posso ajudar hoje?");
    });
  } finally {
    TtsService.prototype.createVoiceNote = originalCreateVoiceNote;
  }
});

test("POST /api/tts/voice-note salvages multiline text from loose json payloads", async () => {
  const originalCreateVoiceNote = TtsService.prototype.createVoiceNote;
  let receivedText = "";

  TtsService.prototype.createVoiceNote = async (text: string) => {
    receivedText = text;

    return {
      buffer: Buffer.from("fake-ogg-audio"),
      filename: "voice-note.ogg",
    };
  };

  try {
    await withServer(async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/tts/voice-note`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer test-bot-token",
        },
        body: `{
  "text": "Ola!

Como posso ajudar hoje?"
}`,
      });

      assert.equal(response.status, 200);
      assert.equal(receivedText, "Ola!\n\nComo posso ajudar hoje?");
    });
  } finally {
    TtsService.prototype.createVoiceNote = originalCreateVoiceNote;
  }
});

test("POST /api/tts/voice-note accepts structured content parts arrays", async () => {
  const originalCreateVoiceNote = TtsService.prototype.createVoiceNote;
  let receivedText = "";

  TtsService.prototype.createVoiceNote = async (text: string) => {
    receivedText = text;

    return {
      buffer: Buffer.from("fake-ogg-audio"),
      filename: "voice-note.ogg",
    };
  };

  try {
    await withServer(async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/tts/voice-note`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer test-bot-token",
        },
        body: JSON.stringify([
          {
            content: {
              parts: [
                {
                  text: "\n\n",
                },
                {
                  text: "Olá! Seja muito bem-vindo(a) à Universo Doce! Como posso te ajudar hoje?",
                  thoughtSignature: "abc123",
                },
              ],
              role: "model",
            },
            finishReason: "STOP",
            index: 0,
          },
        ]),
      });

      assert.equal(response.status, 200);
      assert.equal(
        receivedText,
        "Olá! Seja muito bem-vindo(a) à Universo Doce! Como posso te ajudar hoje?",
      );
    });
  } finally {
    TtsService.prototype.createVoiceNote = originalCreateVoiceNote;
  }
});

test("POST /api/tts/voice-note extracts text from arbitrary nested structures", async () => {
  const originalCreateVoiceNote = TtsService.prototype.createVoiceNote;
  let receivedText = "";

  TtsService.prototype.createVoiceNote = async (text: string) => {
    receivedText = text;

    return {
      buffer: Buffer.from("fake-ogg-audio"),
      filename: "voice-note.ogg",
    };
  };

  try {
    await withServer(async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/tts/voice-note`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer test-bot-token",
        },
        body: JSON.stringify({
          response: {
            candidates: [
              {
                role: "model",
                output: {
                  content: {
                    parts: [
                      { text: "Oi! " },
                      { text: "Quero te ajudar com seu pedido." },
                    ],
                  },
                },
              },
            ],
          },
        }),
      });

      assert.equal(response.status, 200);
      assert.equal(receivedText, "Oi!\nQuero te ajudar com seu pedido.");
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
