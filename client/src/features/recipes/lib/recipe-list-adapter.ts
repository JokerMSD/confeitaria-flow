import type { RecipeListItem, RecipeLookupItem } from "@shared/types";
import type {
  FillingRecipeOption,
  ProductRecipeOption,
  RecipeListCard,
} from "../types/recipe-ui";

function formatOutputLabel(quantity: number, unit: string) {
  return `${quantity} ${unit}`;
}

export function adaptRecipesToCards(recipes: RecipeListItem[]): RecipeListCard[] {
  return recipes.map((recipe) => ({
    id: recipe.id,
    name: recipe.name,
    kind: recipe.kind,
    outputLabel: formatOutputLabel(recipe.outputQuantity, recipe.outputUnit),
    totalCost: recipe.totalCostCents / 100,
    unitCostLabel: `R$ ${(recipe.unitCostCents / 100).toFixed(2)} / ${recipe.outputUnit}`,
    suggestedSalePrice:
      recipe.suggestedSalePriceCents == null
        ? null
        : recipe.suggestedSalePriceCents / 100,
    markupPercent: recipe.markupPercent,
    componentCount: recipe.componentCount,
    notes: recipe.notes ?? "",
  }));
}

export function adaptProductRecipesToOptions(
  recipes: RecipeLookupItem[],
): ProductRecipeOption[] {
  return recipes.map((recipe) => ({
    id: recipe.id,
    name: recipe.name,
    outputLabel: formatOutputLabel(recipe.outputQuantity, recipe.outputUnit),
    suggestedSalePrice:
      recipe.suggestedSalePriceCents == null
        ? null
        : recipe.suggestedSalePriceCents / 100,
  }));
}

export function adaptFillingRecipesToOptions(
  recipes: RecipeLookupItem[],
): FillingRecipeOption[] {
  return recipes.map((recipe) => ({
    id: recipe.id,
    name: recipe.name,
    outputLabel: formatOutputLabel(recipe.outputQuantity, recipe.outputUnit),
    unitCost: recipe.unitCostCents / 100,
  }));
}
