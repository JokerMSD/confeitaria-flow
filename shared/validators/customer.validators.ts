import { z } from "zod";

export const createCustomerInputSchema = z.object({
  firstName: z.string().trim().min(1).max(120),
  lastName: z.string().trim().min(1).max(120),
  email: z.string().trim().email(),
  phone: z.string().trim().max(40).nullable().optional(),
  notes: z.string().trim().max(1000).nullable().optional(),
});

export const updateCustomerInputSchema = createCustomerInputSchema.extend({
  isActive: z.boolean().optional(),
});

export const customerIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const listCustomersFiltersSchema = z.object({
  search: z.string().trim().max(160).optional(),
});
