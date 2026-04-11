export type ChatHistoryRole = "user" | "assistant" | "system";

export interface SaveChatHistoryMessageInput {
  customerPhone: string;
  role: ChatHistoryRole;
  message: string;
  channel?: string;
  metadata?: Record<string, unknown> | null;
}

export interface ChatHistoryMessageItem {
  id: string;
  customerPhone: string;
  role: ChatHistoryRole;
  message: string;
  channel: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface ChatHistoryMessagesResponse {
  customerPhone: string;
  messages: Array<{
    role: ChatHistoryRole;
    message: string;
    createdAt: string;
    channel: string;
    metadata: Record<string, unknown> | null;
  }>;
}

export interface ChatHistoryContextResponse {
  customerPhone: string;
  historyText: string;
}
