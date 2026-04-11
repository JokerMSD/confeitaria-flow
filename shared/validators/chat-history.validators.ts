import { z } from "zod";

export const chatHistoryRoleSchema = z.enum(["user", "assistant", "system"]);

export const chatHistoryPhoneSchema = z.string().trim().min(8);

export const saveChatHistoryMessageSchema = z.object({
  customerPhone: chatHistoryPhoneSchema,
  role: chatHistoryRoleSchema,
  message: z.string().trim().min(1),
  channel: z.string().trim().min(1).max(32).optional(),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
});

export const chatHistoryPhoneParamsSchema = z.object({
  customerPhone: chatHistoryPhoneSchema,
});

export const chatHistoryQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(30).optional(),
});
