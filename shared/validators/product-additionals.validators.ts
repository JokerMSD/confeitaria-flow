import { z } from "zod";
import { centsSchema, uuidSchema } from "./common.validators";

export const productAdditionalSelectionTypeSchema = z.enum([
  "single",
  "multiple",
]);

export const createProductAdditionalOptionInputSchema = z.object({
  name: z.string().trim().min(1).max(120),
  priceDeltaCents: centsSchema.optional().default(0),
  position: z.number().int().nonnegative().optional(),
  notes: z.string().trim().max(500).nullable().optional(),
});

export const createProductAdditionalGroupInputSchema = z
  .object({
    productRecipeId: uuidSchema,
    name: z.string().trim().min(1).max(120),
    selectionType: productAdditionalSelectionTypeSchema,
    minSelections: z.number().int().nonnegative().optional().default(0),
    maxSelections: z.number().int().positive().optional().default(1),
    position: z.number().int().nonnegative().optional(),
    notes: z.string().trim().max(500).nullable().optional(),
    options: z.array(createProductAdditionalOptionInputSchema).min(1),
  })
  .superRefine((value, ctx) => {
    if (value.selectionType === "single" && value.maxSelections !== 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["maxSelections"],
        message: "Grupos de escolha única devem aceitar apenas 1 seleção.",
      });
    }

    if (value.minSelections > value.maxSelections) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["minSelections"],
        message: "minSelections não pode ser maior que maxSelections.",
      });
    }
  });

export const updateProductAdditionalGroupInputSchema =
  createProductAdditionalGroupInputSchema;

export const listProductAdditionalGroupsFiltersSchema = z.object({
  productRecipeId: uuidSchema,
});

export const productAdditionalGroupIdParamsSchema = z.object({
  id: uuidSchema,
});
