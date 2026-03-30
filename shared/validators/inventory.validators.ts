import { z } from "zod";
import { centsSchema, uuidSchema } from "./common.validators";
import { paymentMethodSchema } from "./orders.validators";

export const inventoryItemCategorySchema = z.enum([
  "ProdutoPronto",
  "Ingrediente",
  "Embalagem",
]);

export const inventoryItemUnitSchema = z.enum([
  "un",
  "kg",
  "g",
  "l",
  "ml",
  "caixa",
]);

const quantitySchema = z.number().finite().min(0);
const movementQuantitySchema = z.number().finite().min(0);

export const createInventoryItemInputSchema = z.object({
  name: z.string().trim().min(1).max(160),
  category: inventoryItemCategorySchema,
  currentQuantity: quantitySchema,
  minQuantity: quantitySchema,
  unit: inventoryItemUnitSchema,
  recipeEquivalentQuantity: z.number().finite().positive().nullable().optional(),
  recipeEquivalentUnit: inventoryItemUnitSchema.nullable().optional(),
  purchaseUnitCostCents: centsSchema.nullable().optional(),
  notes: z.string().trim().max(1000).nullable().optional(),
}).superRefine((value, ctx) => {
  const hasEquivalentQuantity = value.recipeEquivalentQuantity != null;
  const hasEquivalentUnit = value.recipeEquivalentUnit != null;

  if (hasEquivalentQuantity !== hasEquivalentUnit) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        "Inventory item recipeEquivalentQuantity and recipeEquivalentUnit must be provided together.",
      path: hasEquivalentQuantity
        ? ["recipeEquivalentUnit"]
        : ["recipeEquivalentQuantity"],
    });
  }

  if (hasEquivalentQuantity && value.category !== "Ingrediente") {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Inventory item recipe equivalence is only supported for Ingrediente.",
      path: ["recipeEquivalentQuantity"],
    });
  }

  if (value.category === "Ingrediente" && value.purchaseUnitCostCents != null && value.purchaseUnitCostCents <= 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Inventory item purchaseUnitCostCents must be greater than zero.",
      path: ["purchaseUnitCostCents"],
    });
  }
});

export const updateInventoryItemInputSchema = createInventoryItemInputSchema;

export const listInventoryItemsFiltersSchema = z.object({
  search: z.string().trim().max(160).optional(),
  category: inventoryItemCategorySchema.optional(),
});

export const inventoryItemIdParamsSchema = z.object({
  id: uuidSchema,
});

export const inventoryMovementTypeSchema = z.enum(["Entrada", "Saida", "Ajuste"]);

export const createInventoryMovementInputSchema = z.object({
  itemId: uuidSchema,
  type: inventoryMovementTypeSchema,
  quantity: movementQuantitySchema,
  reason: z.string().trim().min(1).max(240),
  reference: z.string().trim().max(120).nullable().optional(),
  purchaseAmountCents: centsSchema.nullable().optional(),
  purchaseDiscountCents: centsSchema.nullable().optional(),
  purchasePaymentMethod: paymentMethodSchema.nullable().optional(),
  purchaseEquivalentQuantity: z.number().finite().positive().nullable().optional(),
}).superRefine((value, ctx) => {
  const hasAmount = value.purchaseAmountCents != null;
  const hasMethod = value.purchasePaymentMethod != null;

  if (hasAmount !== hasMethod) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        "Inventory movement purchaseAmountCents and purchasePaymentMethod must be provided together.",
      path: hasAmount ? ["purchasePaymentMethod"] : ["purchaseAmountCents"],
    });
  }

  if (value.purchaseEquivalentQuantity != null && value.type !== "Entrada") {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        "Inventory movement purchaseEquivalentQuantity is only available for stock entries.",
      path: ["purchaseEquivalentQuantity"],
    });
  }

  if (value.purchaseDiscountCents != null && !hasAmount) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        "Inventory movement purchaseDiscountCents requires purchaseAmountCents.",
      path: ["purchaseDiscountCents"],
    });
  }
});

export const listInventoryMovementsFiltersSchema = z.object({
  itemId: uuidSchema.optional(),
  type: inventoryMovementTypeSchema.optional(),
});

export const inventoryMovementIdParamsSchema = z.object({
  id: uuidSchema,
});
