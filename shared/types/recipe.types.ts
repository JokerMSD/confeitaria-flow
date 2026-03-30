import type { InventoryItemUnit } from "./inventory.types";

export type RecipeKind = "Preparacao" | "ProdutoVenda";

export type RecipeComponentType = "Ingrediente" | "Receita";

export interface Recipe {
  id: string;
  name: string;
  kind: RecipeKind;
  outputQuantity: number;
  outputUnit: InventoryItemUnit;
  markupPercent: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface RecipeComponent {
  id: string;
  recipeId: string;
  componentType: RecipeComponentType;
  inventoryItemId: string | null;
  childRecipeId: string | null;
  quantity: number;
  quantityUnit: InventoryItemUnit;
  position: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RecipeComponentResolved extends RecipeComponent {
  inventoryItemName: string | null;
  inventoryItemUnit: InventoryItemUnit | null;
  childRecipeName: string | null;
  childRecipeOutputUnit: InventoryItemUnit | null;
  sourceName: string;
  sourceUnit: InventoryItemUnit;
  totalCostCents: number;
  unitCostCents: number;
}

export interface RecipeCostSummary {
  totalCostCents: number;
  unitCostCents: number;
  suggestedSalePriceCents: number | null;
  hasIncompleteCost: boolean;
}

export interface RecipeListItem extends Recipe, RecipeCostSummary {
  componentCount: number;
}

export interface RecipeDetail extends RecipeListItem {
  components: RecipeComponentResolved[];
}

export interface RecipeLookupItem {
  id: string;
  name: string;
  kind: RecipeKind;
  outputQuantity: number;
  outputUnit: InventoryItemUnit;
  totalCostCents: number;
  unitCostCents: number;
  suggestedSalePriceCents: number | null;
}

export interface CreateRecipeComponentInput {
  componentType: RecipeComponentType;
  inventoryItemId?: string | null;
  childRecipeId?: string | null;
  quantity: number;
  quantityUnit: InventoryItemUnit;
  position?: number;
  notes?: string | null;
}

export interface CreateRecipeInput {
  name: string;
  kind: RecipeKind;
  outputQuantity: number;
  outputUnit: InventoryItemUnit;
  markupPercent: number;
  notes?: string | null;
  components: CreateRecipeComponentInput[];
}

export interface UpdateRecipeInput extends CreateRecipeInput {}

export interface ListRecipesFilters {
  search?: string;
  kind?: RecipeKind;
}
