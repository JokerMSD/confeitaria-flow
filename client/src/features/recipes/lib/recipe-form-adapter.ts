import type {
  CreateRecipeRequest,
  RecipeDetailResponse,
  UpdateRecipeRequest,
} from "@shared/types";
import type {
  RecipeComponentFormState,
  RecipeFormState,
} from "../types/recipe-ui";

function createId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return Math.random().toString(36).slice(2, 11);
}

function numberToString(value: number) {
  return value.toString();
}

function stringToNumber(value: string) {
  const normalized = value.replace(",", ".").trim();
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function createEmptyRecipeComponentState(
  componentType: RecipeComponentFormState["componentType"] = "Ingrediente",
  position = 0,
): RecipeComponentFormState {
  return {
    id: createId(),
    componentType,
    inventoryItemId: "",
    childRecipeId: "",
    quantity: "",
    quantityUnit: componentType === "Ingrediente" ? "g" : "un",
    position,
    notes: "",
  };
}

export function createEmptyRecipeFormState(
  kind: RecipeFormState["kind"] = "Preparacao",
): RecipeFormState {
  return {
    name: "",
    kind,
    outputQuantity: "",
    outputUnit: kind === "ProdutoVenda" ? "un" : "g",
    markupPercent: "100",
    salePrice: "",
    notes: "",
    components: [createEmptyRecipeComponentState()],
  };
}

export function adaptRecipeDetailToFormState(
  response: RecipeDetailResponse,
): RecipeFormState {
  return {
    name: response.data.name,
    kind: response.data.kind,
    outputQuantity: numberToString(response.data.outputQuantity),
    outputUnit: response.data.outputUnit,
    markupPercent: numberToString(response.data.markupPercent),
    salePrice:
      response.data.salePriceCents == null
        ? ""
        : numberToString(response.data.salePriceCents / 100),
    notes: response.data.notes ?? "",
    components: response.data.components.map((component) => ({
      id: component.id,
      componentType: component.componentType,
      inventoryItemId: component.inventoryItemId ?? "",
      childRecipeId: component.childRecipeId ?? "",
      quantity: numberToString(component.quantity),
      quantityUnit: component.quantityUnit,
      position: component.position,
      notes: component.notes ?? "",
    })),
  };
}

function adaptComponents(components: RecipeFormState["components"]) {
  return components.map((component, index) => ({
    componentType: component.componentType,
    inventoryItemId:
      component.componentType === "Ingrediente"
        ? component.inventoryItemId || null
        : null,
    childRecipeId:
      component.componentType === "Receita"
        ? component.childRecipeId || null
        : null,
    quantity: stringToNumber(component.quantity),
    quantityUnit: component.quantityUnit,
    position: component.position ?? index,
    notes: component.notes.trim() || null,
  }));
}

export function adaptRecipeFormToCreatePayload(
  state: RecipeFormState,
): CreateRecipeRequest {
  return {
    data: {
      name: state.name.trim(),
      kind: state.kind,
      outputQuantity: stringToNumber(state.outputQuantity),
      outputUnit: state.outputUnit,
      markupPercent: Math.round(stringToNumber(state.markupPercent)),
      salePriceCents:
        state.salePrice.trim() === ""
          ? null
          : Math.round(stringToNumber(state.salePrice) * 100),
      notes: state.notes.trim() || null,
      components: adaptComponents(state.components),
    },
  };
}

export function adaptRecipeFormToUpdatePayload(
  state: RecipeFormState,
): UpdateRecipeRequest {
  return {
    data: adaptRecipeFormToCreatePayload(state).data,
  };
}
