import { z } from "zod";
import { publicStoreAvailabilityFiltersSchema } from "./production.validators";

export const botOrderStatusLookupInputSchema = z.object({
  customerPhone: z.string().trim().min(8),
  orderNumber: z.string().trim().min(1).optional().nullable(),
  limit: z.number().int().min(1).max(10).optional(),
});

export const botOrderStatusLookupRequestSchema = z.object({
  data: botOrderStatusLookupInputSchema,
});

export const botCheckoutLinkInputSchema = z.object({
  productId: z.string().uuid().optional().nullable(),
});

export const botCheckoutLinkRequestSchema = z.object({
  data: botCheckoutLinkInputSchema,
});

export const botAvailabilityQuerySchema = publicStoreAvailabilityFiltersSchema;
