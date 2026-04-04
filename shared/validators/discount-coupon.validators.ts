import { z } from "zod";
import { centsSchema, uuidSchema } from "./common.validators";

export const discountCouponTypeSchema = z.enum(["Percentual", "ValorFixo"]);

const discountValueSchema = z.union([
  z.object({
    discountType: z.literal("Percentual"),
    discountValue: z
      .number()
      .int()
      .min(1, "Percentual deve ser maior que zero.")
      .max(100, "Percentual nao pode passar de 100."),
  }),
  z.object({
    discountType: z.literal("ValorFixo"),
    discountValue: centsSchema.refine((value) => value > 0, {
      message: "Valor fixo precisa ser maior que zero.",
    }),
  }),
]);

export const createDiscountCouponInputSchema = z
  .object({
    code: z.string().trim().min(1).max(64),
    title: z.string().trim().min(1).max(160),
    description: z.string().trim().max(2000).nullable().optional(),
    minimumOrderAmountCents: centsSchema.optional().default(0),
    isActive: z.boolean().optional().default(true),
  })
  .and(discountValueSchema);

export const updateDiscountCouponInputSchema = z
  .object({
    code: z.string().trim().min(1).max(64).optional(),
    title: z.string().trim().min(1).max(160).optional(),
    description: z.string().trim().max(2000).nullable().optional(),
    minimumOrderAmountCents: centsSchema.optional(),
    isActive: z.boolean().optional(),
  })
  .and(
    z.union([
      z.object({
        discountType: z.literal("Percentual"),
        discountValue: z.number().int().min(1).max(100),
      }),
      z.object({
        discountType: z.literal("ValorFixo"),
        discountValue: centsSchema.refine((value) => value > 0),
      }),
      z.object({
        discountType: discountCouponTypeSchema.optional(),
        discountValue: z.number().int().nonnegative().optional(),
      }),
    ]),
  );

export const discountCouponIdParamsSchema = z.object({
  id: uuidSchema,
});
