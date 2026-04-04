import { z } from "zod";
import {
  centsSchema,
  deliveryTimeSchema,
  operationalDateSchema,
  uuidSchema,
} from "./common.validators";
import {
  createOrderItemAdditionalInputSchema,
  deliveryModeSchema,
} from "./orders.validators";

const checkoutPaymentMethodSchema = z.enum(["Pix", "MercadoPagoCartao"]);

const mercadoPagoPayerSchema = z.object({
  email: z.string().trim().email().max(320),
  identificationType: z.enum(["CPF", "CNPJ"]),
  identificationNumber: z.string().trim().min(11).max(18),
});

const mercadoPagoCardSchema = z.object({
  token: z.string().trim().min(1).max(160),
  paymentMethodId: z.string().trim().min(1).max(80),
  issuerId: z.string().trim().max(80).nullable().optional(),
  installments: z.number().int().min(1).max(24),
  cardholderName: z.string().trim().max(160).nullable().optional(),
  lastFourDigits: z.string().trim().length(4).nullable().optional(),
});

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
    customerEmail: z.string().trim().email().max(320).nullable().optional(),
    deliveryMode: deliveryModeSchema,
    deliveryDate: operationalDateSchema,
    deliveryTime: deliveryTimeSchema.nullable().optional(),
    deliveryAddress: z.string().trim().max(240).nullable().optional(),
    deliveryReference: z.string().trim().max(240).nullable().optional(),
    deliveryDistrict: z.string().trim().max(120).nullable().optional(),
    deliveryFeeCents: centsSchema.optional().default(0),
    couponCode: z.string().trim().max(64).nullable().optional(),
    paymentMethod: checkoutPaymentMethodSchema.optional().default("Pix"),
    payer: mercadoPagoPayerSchema.nullable().optional(),
    mercadoPagoCard: mercadoPagoCardSchema.nullable().optional(),
    notes: z.string().trim().max(2000).nullable().optional(),
    items: z.array(publicCheckoutItemInputSchema).min(1),
  })
  .superRefine((value, ctx) => {
    if (value.deliveryMode === "Entrega" && !value.deliveryAddress?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["deliveryAddress"],
        message: "Endereco de entrega e obrigatorio para pedidos com entrega.",
      });
    }

    if (value.paymentMethod === "MercadoPagoCartao") {
      if (!value.customerEmail?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["customerEmail"],
          message: "E-mail e obrigatorio para pagamento com cartao.",
        });
      }

      if (!value.payer) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["payer"],
          message: "Dados do pagador sao obrigatorios para pagamento com cartao.",
        });
      }

      if (!value.mercadoPagoCard) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["mercadoPagoCard"],
          message: "Dados do cartao sao obrigatorios para o checkout transparente.",
        });
      }
    }
  });

export const publicCheckoutPricingPreviewInputSchema = z.object({
  deliveryMode: deliveryModeSchema,
  deliveryFeeCents: centsSchema.optional().default(0),
  couponCode: z.string().trim().max(64).nullable().optional(),
  items: z.array(publicCheckoutItemInputSchema).min(1),
});
