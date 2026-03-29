import { z } from "zod";
import {
  deliveryTimeSchema,
  operationalDateSchema,
  uuidSchema,
} from "./common.validators";
import { paymentMethodSchema } from "./orders.validators";

export const cashTransactionTypeSchema = z.enum(["Entrada", "Saida"]);

export const cashTransactionDateTimeSchema = z
  .string()
  .datetime({ offset: true });

export const createCashTransactionInputSchema = z.object({
  type: cashTransactionTypeSchema,
  category: z.string().trim().min(1).max(80),
  description: z.string().trim().min(1).max(240),
  amountCents: z.number().int().positive(),
  paymentMethod: paymentMethodSchema,
  transactionDate: cashTransactionDateTimeSchema,
  orderId: uuidSchema.nullable().optional(),
});

export const updateCashTransactionInputSchema = createCashTransactionInputSchema;

export const listCashTransactionsFiltersSchema = z.object({
  search: z.string().trim().max(160).optional(),
  type: cashTransactionTypeSchema.optional(),
  category: z.string().trim().max(80).optional(),
  paymentMethod: paymentMethodSchema.optional(),
  dateFrom: operationalDateSchema.optional(),
  dateTo: operationalDateSchema.optional(),
});

export const getCashSummaryFiltersSchema = z.object({
  date: operationalDateSchema.optional(),
});

export const cashTransactionIdParamsSchema = z.object({
  id: uuidSchema,
});
