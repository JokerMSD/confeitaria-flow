import { z } from "zod";
import {
  operationalDateSchema,
  uuidSchema,
} from "./common.validators";

export const whatsappAssistantPhoneParamsSchema = z.object({
  phone: z.string().trim().min(1).max(40),
});

export const whatsappAssistantOrderIdParamsSchema = z.object({
  id: uuidSchema,
});

export const whatsappAssistantCustomerUpsertSchema = z.object({
  phone: z.string().trim().min(1).max(40),
  name: z.string().trim().max(160).optional(),
  address: z.string().trim().max(240).optional(),
  notes: z.string().trim().max(2000).optional(),
});

export const whatsappAssistantCatalogSearchQuerySchema = z.object({
  q: z.string().trim().min(1).max(160),
});

export const whatsappAssistantDraftUpsertSchema = z.object({
  customerPhone: z.string().trim().min(1).max(40),
  productId: uuidSchema.optional(),
  productName: z.string().trim().max(160).optional(),
  quantity: z.coerce.number().int().positive().optional(),
  flavor: z.string().trim().max(160).optional(),
  deliveryDate: operationalDateSchema.optional(),
  deliveryType: z.enum(["pickup", "delivery"]).optional(),
  address: z.string().trim().max(240).optional(),
  notes: z.string().trim().max(2000).optional(),
});

export const whatsappAssistantDraftConfirmSchema = z.object({
  customerPhone: z.string().trim().min(1).max(40),
});
