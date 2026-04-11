import assert from "node:assert/strict";
import test from "node:test";
import { ChatHistoryService } from "../../server/services/chat-history.service";

test("chat history service saves a valid message", async () => {
  const service = new ChatHistoryService() as any;

  service.repository = {
    create: async (data: Record<string, unknown>) => ({
      id: "msg-1",
      ...data,
      createdAt: new Date("2026-04-11T10:00:00.000Z"),
    }),
  };

  const result = await service.saveMessage({
    customerPhone: "(31) 8250-2353",
    role: "user",
    message: "  Quero um bolo de chocolate  ",
    channel: "whatsapp",
    metadata: {
      messageType: "text",
    },
  });

  assert.equal(result.customerPhone, "3182502353");
  assert.equal(result.role, "user");
  assert.equal(result.message, "Quero um bolo de chocolate");
  assert.equal(result.channel, "whatsapp");
  assert.deepEqual(result.metadata, { messageType: "text" });
});

test("chat history service rejects empty normalized messages", async () => {
  const service = new ChatHistoryService();

  await assert.rejects(
    () =>
      service.saveMessage({
        customerPhone: "553182502353",
        role: "user",
        message: "   ",
      }),
    /Mensagem obrigatoria\./,
  );
});

test("chat history service fetches recent messages in chronological order", async () => {
  const service = new ChatHistoryService() as any;
  let capturedLimit = 0;

  service.repository = {
    listRecentByCustomerPhone: async (_phone: string, limit: number) => {
      capturedLimit = limit;

      return [
        {
          role: "assistant",
          message: "Oi! Como posso ajudar?",
          channel: "whatsapp",
          metadataJson: null,
          createdAt: new Date("2026-04-11T10:01:00.000Z"),
        },
        {
          role: "user",
          message: "Oi",
          channel: "whatsapp",
          metadataJson: null,
          createdAt: new Date("2026-04-11T10:00:00.000Z"),
        },
      ];
    },
  };

  const result = await service.getRecentMessages("553182502353", 50);

  assert.equal(capturedLimit, 30);
  assert.equal(result.customerPhone, "553182502353");
  assert.deepEqual(
    result.messages.map((message) => message.message),
    ["Oi", "Oi! Como posso ajudar?"],
  );
});

test("chat history service builds prompt context correctly", async () => {
  const service = new ChatHistoryService() as any;

  service.repository = {
    listRecentByCustomerPhone: async () => [
      {
        role: "user",
        message: "Quero um bolo",
        channel: "whatsapp",
        metadataJson: null,
        createdAt: new Date("2026-04-11T10:01:00.000Z"),
      },
      {
        role: "assistant",
        message: "Olá! Como posso ajudar?",
        channel: "whatsapp",
        metadataJson: null,
        createdAt: new Date("2026-04-11T10:00:00.000Z"),
      },
      {
        role: "system",
        message: "Cliente recorrente",
        channel: "whatsapp",
        metadataJson: null,
        createdAt: new Date("2026-04-11T09:59:00.000Z"),
      },
    ],
  };

  const result = await service.getConversationContext("553182502353", 10);

  assert.equal(
    result.historyText,
    "Sistema: Cliente recorrente\nBot: Olá! Como posso ajudar?\nCliente: Quero um bolo",
  );
});
