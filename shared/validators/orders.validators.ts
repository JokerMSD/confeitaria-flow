import { z } from "zod";
import {
  centsSchema,
  deliveryTimeSchema,
  operationalDateSchema,
  uuidSchema,
} from "./common.validators";

export const createOrderItemAdditionalInputSchema = z.object({
  groupId: uuidSchema,
  optionId: uuidSchema,
  position: z.number().int().nonnegative().optional(),
});

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

export const deliveryModeSchema = z.enum(["Entrega", "Retirada"]);

const createOrderDiscountInputSchema = z.union([
  z.object({
    source: z.enum(["Manual", "Cupom"]).optional().default("Manual"),
    type: z.literal("Percentual"),
    value: z.number().int().min(1).max(100),
    label: z.string().trim().max(160).nullable().optional(),
    couponCode: z.string().trim().max(64).nullable().optional(),
  }),
  z.object({
    source: z.enum(["Manual", "Cupom"]).optional().default("Manual"),
    type: z.literal("ValorFixo"),
    value: centsSchema.refine((amount) => amount > 0, {
      message: "Desconto fixo precisa ser maior que zero.",
    }),
    label: z.string().trim().max(160).nullable().optional(),
    couponCode: z.string().trim().max(64).nullable().optional(),
  }),
]);

export const createOrderItemInputSchema = z.object({
  recipeId: uuidSchema.nullable().optional(),
  fillingRecipeId: uuidSchema.nullable().optional(),
  secondaryFillingRecipeId: uuidSchema.nullable().optional(),
  tertiaryFillingRecipeId: uuidSchema.nullable().optional(),
  productName: z.string().trim().min(1).max(160),
  quantity: z.number().positive(),
  unitPriceCents: centsSchema,
  position: z.number().int().nonnegative().optional(),
  additionals: z.array(createOrderItemAdditionalInputSchema).optional(),
});

export const createOrderInputSchema = z
  .object({
    customerName: z.string().trim().min(1).max(160),
    customerId: z.string().uuid().optional(),
    customerPhone: z.string().trim().max(40).nullable().optional(),
    orderDate: operationalDateSchema,
    deliveryDate: operationalDateSchema,
    deliveryTime: deliveryTimeSchema.nullable().optional(),
    deliveryMode: deliveryModeSchema,
    deliveryAddress: z.string().trim().max(240).nullable().optional(),
    deliveryReference: z.string().trim().max(240).nullable().optional(),
    deliveryDistrict: z.string().trim().max(120).nullable().optional(),
    deliveryFeeCents: centsSchema.optional().default(0),
    status: orderStatusSchema,
    paymentMethod: paymentMethodSchema,
    paidAmountCents: centsSchema,
    discount: createOrderDiscountInputSchema.nullable().optional(),
    notes: z.string().trim().max(2000).nullable().optional(),
    items: z.array(createOrderItemInputSchema).min(1),
  })
  .superRefine((value, ctx) => {
    if (value.deliveryMode === "Entrega" && !value.deliveryAddress?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["deliveryAddress"],
        message: "Endereço de entrega é obrigatório para pedidos com entrega.",
      });
    }
  });

export const updateOrderInputSchema = createOrderInputSchema.and(
  z.object({
    lastKnownUpdatedAt: z.string().datetime().nullable().optional(),
  }),
);

export const updateOrderStatusInputSchema = z.object({
  status: orderStatusSchema,
  lastKnownUpdatedAt: z.string().datetime().nullable().optional(),
});

export const listOrdersFiltersSchema = z.object({
  search: z.string().trim().max(160).optional(),
  status: orderStatusSchema.optional(),
  deliveryDate: operationalDateSchema.optional(),
  paymentStatus: paymentStatusSchema.optional(),
});

export const orderIdParamsSchema = z.object({
  id: uuidSchema,
});
