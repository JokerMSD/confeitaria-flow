import {
  getN8nForwardTimeoutMs,
  getN8nWhatsAppWebhookUrl,
  getWhatsAppVerifyToken,
  isWhatsAppWebhookDebugEnabled,
} from "../config";

type WhatsAppMessageType = "text" | "audio" | string;

type WhatsAppEnvelopeValue = {
  messages?: Array<{
    from?: string | null;
    type?: WhatsAppMessageType | null;
  }>;
  statuses?: Array<{
    status?: string | null;
  }>;
};

function getWebhookValues(payload: unknown): WhatsAppEnvelopeValue[] {
  const directValue =
    payload && typeof payload === "object" ? (payload as Record<string, unknown>) : null;
  const values: WhatsAppEnvelopeValue[] = [];

  if (
    directValue?.entry &&
    Array.isArray(directValue.entry)
  ) {
    for (const rawEntry of directValue.entry) {
      if (!rawEntry || typeof rawEntry !== "object") {
        continue;
      }

      const entry = rawEntry as Record<string, unknown>;
      const changes = Array.isArray(entry.changes) ? entry.changes : [];

      for (const rawChange of changes) {
        if (!rawChange || typeof rawChange !== "object") {
          continue;
        }

        const value = (rawChange as Record<string, unknown>).value;

        if (value && typeof value === "object") {
          values.push(value as WhatsAppEnvelopeValue);
        }
      }
    }
  }

  if (values.length > 0) {
    return values;
  }

  return [(directValue ?? {}) as WhatsAppEnvelopeValue];
}

export function getWhatsAppUserMessage(payload: unknown) {
  for (const value of getWebhookValues(payload)) {
    const [message] = value.messages ?? [];

    if (!message || typeof message !== "object") {
      continue;
    }

    return {
      from: typeof message.from === "string" ? message.from : null,
      type: typeof message.type === "string" ? message.type : null,
    };
  }

  return null;
}

export function hasWhatsAppStatuses(payload: unknown) {
  return getWebhookValues(payload).some(
    (value) => Array.isArray(value.statuses) && value.statuses.length > 0,
  );
}

/**
 * Accepted example:
 * { entry:[{ changes:[{ value:{ messages:[{ from:"5531999990000", type:"text" }] } }] }] }
 *
 * Ignored examples:
 * { entry:[{ changes:[{ value:{ statuses:[{ status:"delivered" }] } }] }] }
 * { entry:[{ changes:[{ value:{} }] }] }
 */
export function isWhatsAppUserMessage(payload: unknown) {
  if (hasWhatsAppStatuses(payload)) {
    return false;
  }

  const message = getWhatsAppUserMessage(payload);

  if (!message?.from) {
    return false;
  }

  return message.type === "text" || message.type === "audio";
}

export function summarizeWhatsAppWebhook(payload: unknown) {
  if (hasWhatsAppStatuses(payload)) {
    const firstStatusValue = getWebhookValues(payload).find(
      (value) => Array.isArray(value.statuses) && value.statuses.length > 0,
    );
    const [status] = firstStatusValue?.statuses ?? [];
    return `status:${status?.status ?? "unknown"}`;
  }

  const message = getWhatsAppUserMessage(payload);

  if (message?.from) {
    return `message:${message.type ?? "unknown"}:${message.from}`;
  }

  return "ignored:unsupported";
}

export function getWhatsAppWebhookDebugSnapshot(payload: unknown) {
  const values = getWebhookValues(payload);
  const message = getWhatsAppUserMessage(payload);
  const firstStatusValue = values.find(
    (value) => Array.isArray(value.statuses) && value.statuses.length > 0,
  );
  const [status] = firstStatusValue?.statuses ?? [];

  return {
    entryCount: values.length,
    hasMessages: values.some(
      (value) => Array.isArray(value.messages) && value.messages.length > 0,
    ),
    hasStatuses: values.some(
      (value) => Array.isArray(value.statuses) && value.statuses.length > 0,
    ),
    messageType: message?.type ?? null,
    messageFrom: message?.from ?? null,
    status: status?.status ?? null,
  };
}

export class WhatsAppWebhookService {
  isVerificationRequestValid(input: {
    mode?: string | null;
    verifyToken?: string | null;
  }) {
    const expectedToken = getWhatsAppVerifyToken();
    return Boolean(
      expectedToken &&
        input.mode === "subscribe" &&
        input.verifyToken &&
        input.verifyToken === expectedToken,
    );
  }

  logDebug(label: string, payload?: unknown) {
    if (!isWhatsAppWebhookDebugEnabled()) {
      return;
    }

    if (payload === undefined) {
      console.info(`[whatsapp-webhook][debug] ${label}`);
      return;
    }

    console.info(`[whatsapp-webhook][debug] ${label}`, payload);
  }

  async forwardToN8n(payload: unknown) {
    const webhookUrl = getN8nWhatsAppWebhookUrl();

    if (!webhookUrl) {
      console.warn("[whatsapp-webhook] N8N_WHATSAPP_WEBHOOK_URL not configured.");
      this.logDebug("forward skipped: missing N8N_WHATSAPP_WEBHOOK_URL");
      return { forwarded: false as const, reason: "missing-webhook-url" };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), getN8nForwardTimeoutMs());
    this.logDebug("forward start", {
      webhookUrl,
      summary: summarizeWhatsAppWebhook(payload),
      timeoutMs: getN8nForwardTimeoutMs(),
    });

    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!response.ok) {
        console.error(
          `[whatsapp-webhook] n8n forward failed with status ${response.status}.`,
        );
        this.logDebug("forward failed", {
          status: response.status,
          summary: summarizeWhatsAppWebhook(payload),
        });
        return { forwarded: false as const, reason: "n8n-error" };
      }

      this.logDebug("forward success", {
        status: response.status,
        summary: summarizeWhatsAppWebhook(payload),
      });
      return { forwarded: true as const };
    } catch (error) {
      console.error("[whatsapp-webhook] n8n forward failed.", error);
      this.logDebug("forward exception", {
        summary: summarizeWhatsAppWebhook(payload),
        error:
          error instanceof Error
            ? { message: error.message, name: error.name }
            : String(error),
      });
      return { forwarded: false as const, reason: "request-error" };
    } finally {
      clearTimeout(timeout);
    }
  }
}
