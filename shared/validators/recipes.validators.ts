import { z } from "zod";
import { uuidSchema } from "./common.validators";
import { inventoryItemUnitSchema } from "./inventory.validators";

export const recipeKindSchema = z.enum(["Preparacao", "ProdutoVenda"]);

export const recipeComponentTypeSchema = z.enum(["Ingrediente", "Receita"]);

const recipeQuantitySchema = z.number().finite().positive();

export const createRecipeComponentInputSchema = z
  .object({
    componentType: recipeComponentTypeSchema,
    inventoryItemId: uuidSchema.nullable().optional(),
    childRecipeId: uuidSchema.nullable().optional(),
    quantity: recipeQuantitySchema,
    quantityUnit: inventoryItemUnitSchema,
    position: z.number().int().nonnegative().optional(),
    notes: z.string().trim().max(500).nullable().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.componentType === "Ingrediente" && !value.inventoryItemId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Recipe component inventoryItemId is required for Ingrediente.",
        path: ["inventoryItemId"],
      });
    }

    if (value.componentType === "Receita" && !value.childRecipeId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Recipe component childRecipeId is required for Receita.",
        path: ["childRecipeId"],
      });
    }
  });

export const createRecipeInputSchema = z
  .object({
    name: z.string().trim().min(1).max(160),
    kind: recipeKindSchema,
    outputQuantity: recipeQuantitySchema,
    outputUnit: inventoryItemUnitSchema,
    markupPercent: z.number().int().min(0).max(10000),
    notes: z.string().trim().max(1000).nullable().optional(),
    components: z.array(createRecipeComponentInputSchema).min(1),
  })
  .superRefine((value, ctx) => {
    if (
      value.kind === "ProdutoVenda" &&
      (value.outputUnit !== "un" || value.outputQuantity !== 1)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "ProdutoVenda recipes must have outputQuantity 1 and outputUnit un.",
        path: ["outputUnit"],
      });
    }
  });

export const updateRecipeInputSchema = createRecipeInputSchema;

export const listRecipesFiltersSchema = z.object({
  search: z.string().trim().max(160).optional(),
  kind: recipeKindSchema.optional(),
});

export const recipeIdParamsSchema = z.object({
  id: uuidSchema,
});
