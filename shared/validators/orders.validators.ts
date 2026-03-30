import { z } from "zod";
import {
  centsSchema,
  deliveryTimeSchema,
  operationalDateSchema,
  uuidSchema,
} from "./common.validators";

export const orderStatusSchema = z.enum([
  "Novo",
  "Confirmado",
  "EmProducao",
  "Pronto",
  "Entregue",
  "Cancelado",
]);

export const paymentStatusSchema = z.enum(["Pendente", "Parcial", "Pago"]);

export const paymentMethodSchema = z.enum([
  "Pix",
  "Dinheiro",
  "CartaoCredito",
  "CartaoDebito",
  "Transferencia",
]);

export const createOrderItemInputSchema = z.object({
  recipeId: uuidSchema.nullable().optional(),
  productName: z.string().trim().min(1).max(160),
  quantity: z.number().positive(),
  unitPriceCents: centsSchema,
  position: z.number().int().nonnegative().optional(),
});

export const createOrderInputSchema = z.object({
  customerName: z.string().trim().min(1).max(160),
  customerPhone: z.string().trim().max(40).nullable().optional(),
  orderDate: operationalDateSchema,
  deliveryDate: operationalDateSchema,
  deliveryTime: deliveryTimeSchema.nullable().optional(),
  status: orderStatusSchema,
  paymentMethod: paymentMethodSchema,
  paidAmountCents: centsSchema,
  notes: z.string().trim().max(2000).nullable().optional(),
  items: z.array(createOrderItemInputSchema).min(1),
});

export const updateOrderInputSchema = createOrderInputSchema;

export const listOrdersFiltersSchema = z.object({
  search: z.string().trim().max(160).optional(),
  status: orderStatusSchema.optional(),
  deliveryDate: operationalDateSchema.optional(),
  paymentStatus: paymentStatusSchema.optional(),
});

export const orderIdParamsSchema = z.object({
  id: uuidSchema,
});
