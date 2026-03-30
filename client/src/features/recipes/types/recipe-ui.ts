export type UiRecipeKind = "Preparacao" | "ProdutoVenda";

export type UiRecipeComponentType = "Ingrediente" | "Receita";

export interface RecipeListCard {
  id: string;
  name: string;
  kind: UiRecipeKind;
  outputLabel: string;
  totalCost: number;
  unitCostLabel: string;
  suggestedSalePrice: number | null;
  markupPercent: number;
  componentCount: number;
  notes: string;
}

export interface RecipeComponentFormState {
  id: string;
  componentType: UiRecipeComponentType;
  inventoryItemId: string;
  childRecipeId: string;
  quantity: string;
  quantityUnit: "un" | "kg" | "g" | "l" | "ml" | "caixa";
  position: number;
  notes: string;
}

export interface RecipeFormState {
  name: string;
  kind: UiRecipeKind;
  outputQuantity: string;
  outputUnit: "un" | "kg" | "g" | "l" | "ml" | "caixa";
  markupPercent: string;
  notes: string;
  components: RecipeComponentFormState[];
}

export interface ProductRecipeOption {
  id: string;
  name: string;
  outputLabel: string;
  suggestedSalePrice: number | null;
}

export interface FillingRecipeOption {
  id: string;
  name: string;
  outputLabel: string;
  unitCost: number;
}
