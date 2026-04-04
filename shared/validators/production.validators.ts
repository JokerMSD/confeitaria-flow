import { z } from "zod";
import {
  centsSchema,
  deliveryTimeSchema,
  operationalDateSchema,
  uuidSchema,
} from "./common.validators";
import { createOrderItemAdditionalInputSchema, deliveryModeSchema } from "./orders.validators";

export const productionForecastFiltersSchema = z.object({
  deliveryDate: operationalDateSchema.optional(),
  dateFrom: operationalDateSchema.optional(),
  dateTo: operationalDateSchema.optional(),
});

export const publicCheckoutItemInputSchema = z.object({
  recipeId: uuidSchema,
  quantity: z.number().positive(),
  fillingRecipeId: uuidSchema.nullable().optional(),
  secondaryFillingRecipeId: uuidSchema.nullable().optional(),
  tertiaryFillingRecipeId: uuidSchema.nullable().optional(),
  additionals: z.array(createOrderItemAdditionalInputSchema).optional(),
});

export const publicCheckoutInputSchema = z
  .object({
    customerName: z.string().trim().min(1).max(160),
    customerPhone: z.string().trim().max(40).nullable().optional(),
    deliveryMode: deliveryModeSchema,
    deliveryDate: operationalDateSchema,
    deliveryTime: deliveryTimeSchema.nullable().optional(),
    deliveryAddress: z.string().trim().max(240).nullable().optional(),
    deliveryReference: z.string().trim().max(240).nullable().optional(),
    deliveryDistrict: z.string().trim().max(120).nullable().optional(),
    deliveryFeeCents: centsSchema.optional().default(0),
    couponCode: z.string().trim().max(64).nullable().optional(),
    notes: z.string().trim().max(2000).nullable().optional(),
    items: z.array(publicCheckoutItemInputSchema).min(1),
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

export const publicCheckoutPricingPreviewInputSchema = z.object({
  deliveryMode: deliveryModeSchema,
  deliveryFeeCents: centsSchema.optional().default(0),
  couponCode: z.string().trim().max(64).nullable().optional(),
  items: z.array(publicCheckoutItemInputSchema).min(1),
});
