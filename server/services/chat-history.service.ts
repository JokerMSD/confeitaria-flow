import type {
  ChatHistoryContextResponse,
  ChatHistoryMessageItem,
  ChatHistoryMessagesResponse,
  ChatHistoryRole,
  SaveChatHistoryMessageInput,
} from "@shared/types";
import { ChatHistoryRepository } from "../repositories/chat-history.repository";
import { HttpError } from "../utils/http-error";

function normalizeCustomerPhone(rawPhone: string) {
  const trimmed = rawPhone.trim();
  const digitsOnly = trimmed.replace(/\D+/g, "");

  return digitsOnly.length >= 8 ? digitsOnly : trimmed;
}

function normalizeMessage(rawMessage: string) {
  return rawMessage.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
}

function normalizeChannel(rawChannel?: string) {
  const normalized = rawChannel?.trim();
  return normalized ? normalized.slice(0, 32) : "whatsapp";
}

function normalizeLimit(limit?: number) {
  if (!Number.isFinite(limit)) {
    return 10;
  }

  return Math.min(30, Math.max(1, Math.trunc(limit ?? 10)));
}

function getRoleLabel(role: ChatHistoryRole) {
  if (role === "user") {
    return "Cliente";
  }

  if (role === "assistant") {
    return "Bot";
  }

  return "Sistema";
}

export class ChatHistoryService {
  repository = new ChatHistoryRepository();

  private mapItem(row: any): ChatHistoryMessageItem {
    return {
      id: row.id,
      customerPhone: row.customerPhone,
      role: row.role,
      message: row.message,
      channel: row.channel,
      metadata: (row.metadataJson as Record<string, unknown> | null) ?? null,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async saveMessage(input: SaveChatHistoryMessageInput) {
    const customerPhone = normalizeCustomerPhone(input.customerPhone);
    const message = normalizeMessage(input.message);

    if (!customerPhone) {
      throw new HttpError(400, "Telefone do cliente obrigatorio.");
    }

    if (!message) {
      throw new HttpError(400, "Mensagem obrigatoria.");
    }

    const row = await this.repository.create({
      customerPhone,
      role: input.role,
      message,
      channel: normalizeChannel(input.channel),
      metadataJson: input.metadata ?? null,
    });

    console.info(`[chat-history] saved ${input.role} message for ${customerPhone}`);
    return this.mapItem(row);
  }

  async getRecentMessages(
    customerPhone: string,
    limit?: number,
  ): Promise<ChatHistoryMessagesResponse> {
    const normalizedPhone = normalizeCustomerPhone(customerPhone);
    const safeLimit = normalizeLimit(limit);
    const rows = await this.repository.listRecentByCustomerPhone(
      normalizedPhone,
      safeLimit,
    );
    const messages = rows
      .slice()
      .reverse()
      .map((row: any) => ({
        role: row.role as ChatHistoryRole,
        message: row.message,
        createdAt: row.createdAt.toISOString(),
        channel: row.channel,
        metadata: (row.metadataJson as Record<string, unknown> | null) ?? null,
      }));

    console.info(
      `[chat-history] fetched ${messages.length} messages for ${normalizedPhone}`,
    );

    return {
      customerPhone: normalizedPhone,
      messages,
    };
  }

  async getConversationContext(
    customerPhone: string,
    limit?: number,
  ): Promise<ChatHistoryContextResponse> {
    const recent = await this.getRecentMessages(customerPhone, limit);
    const historyText = recent.messages
      .map((message) => `${getRoleLabel(message.role)}: ${message.message}`)
      .join("\n");

    console.info(
      `[chat-history] built prompt context for ${recent.customerPhone}`,
    );

    return {
      customerPhone: recent.customerPhone,
      historyText,
    };
  }
}
