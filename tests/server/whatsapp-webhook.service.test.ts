import assert from "node:assert/strict";
import test from "node:test";
import {
  hasWhatsAppStatuses,
  isWhatsAppUserMessage,
  summarizeWhatsAppWebhook,
} from "../../server/services/whatsapp-webhook.service";

const messagePayload = {
  object: "whatsapp_business_account",
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

const statusPayload = {
  object: "whatsapp_business_account",
  entry: [
    {
      changes: [
        {
          value: {
            statuses: [
              {
                status: "delivered",
              },
            ],
          },
        },
      ],
    },
  ],
};

test("isWhatsAppUserMessage accepts text message events", () => {
  assert.equal(isWhatsAppUserMessage(messagePayload), true);
});

test("isWhatsAppUserMessage ignores statuses payloads", () => {
  assert.equal(isWhatsAppUserMessage(statusPayload), false);
  assert.equal(hasWhatsAppStatuses(statusPayload), true);
});

test("summarizeWhatsAppWebhook keeps logs short and useful", () => {
  assert.equal(summarizeWhatsAppWebhook(messagePayload), "message:text:5531999990000");
  assert.equal(summarizeWhatsAppWebhook(statusPayload), "status:delivered");
});
