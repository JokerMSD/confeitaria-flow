import type { Express } from "express";
import {
  chatHistoryPhoneParamsSchema,
  chatHistoryQuerySchema,
  saveChatHistoryMessageSchema,
} from "@shared/validators";
import { requireBotToken } from "../../middlewares/require-bot-token";
import { validateRequest } from "../../middlewares/validate-request";
import { ChatHistoryController } from "./chat-history.controller";

export function registerChatHistoryRoutes(app: Express) {
  const controller = new ChatHistoryController();

  app.use("/api/chat-history", requireBotToken);
  app.post(
    "/api/chat-history/messages",
    validateRequest(saveChatHistoryMessageSchema, "body"),
    controller.saveMessage.bind(controller),
  );
  app.get(
    "/api/chat-history/:customerPhone",
    validateRequest(chatHistoryPhoneParamsSchema, "params"),
    validateRequest(chatHistoryQuerySchema, "query"),
    controller.getRecentMessages.bind(controller),
  );
  app.get(
    "/api/chat-history/:customerPhone/context",
    validateRequest(chatHistoryPhoneParamsSchema, "params"),
    validateRequest(chatHistoryQuerySchema, "query"),
    controller.getConversationContext.bind(controller),
  );
}
