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

const multiChangeMessagePayload = {
  object: "whatsapp_business_account",
  entry: [
    {
      changes: [
        {
          value: {},
        },
        {
          value: {
            messages: [
              {
                from: "5531888887777",
                type: "audio",
              },
            ],
          },
        },
      ],
    },
  ],
};

const multiEntryStatusPayload = {
  object: "whatsapp_business_account",
  entry: [
    {
      changes: [
        {
          value: {},
        },
      ],
    },
    {
      changes: [
        {
          value: {
            statuses: [
              {
                status: "read",
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

test("isWhatsAppUserMessage scans all changes for supported messages", () => {
  assert.equal(isWhatsAppUserMessage(multiChangeMessagePayload), true);
  assert.equal(
    summarizeWhatsAppWebhook(multiChangeMessagePayload),
    "message:audio:5531888887777",
  );
});

test("isWhatsAppUserMessage ignores statuses payloads", () => {
  assert.equal(isWhatsAppUserMessage(statusPayload), false);
  assert.equal(hasWhatsAppStatuses(statusPayload), true);
});

test("hasWhatsAppStatuses scans all entries for status callbacks", () => {
  assert.equal(isWhatsAppUserMessage(multiEntryStatusPayload), false);
  assert.equal(hasWhatsAppStatuses(multiEntryStatusPayload), true);
  assert.equal(summarizeWhatsAppWebhook(multiEntryStatusPayload), "status:read");
});

test("summarizeWhatsAppWebhook keeps logs short and useful", () => {
  assert.equal(summarizeWhatsAppWebhook(messagePayload), "message:text:5531999990000");
  assert.equal(summarizeWhatsAppWebhook(statusPayload), "status:delivered");
});
