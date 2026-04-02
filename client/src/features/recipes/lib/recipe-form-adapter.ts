import type {
  CreateRecipeRequest,
  RecipeDetailResponse,
  UpdateRecipeRequest,
} from "@shared/types";
import {
  formatMoneyInput,
  parseDecimalInput,
  parseMoneyInputToCents,
} from "@/features/inventory/lib/inventory-input-helpers";
import type {
  RecipeAdditionalGroupFormState,
  RecipeAdditionalOptionFormState,
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
  return parseDecimalInput(value);
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

export function createEmptyRecipeAdditionalOptionState(
  position = 0,
): RecipeAdditionalOptionFormState {
  return {
    id: createId(),
    name: "",
    priceDelta: "",
    position,
    notes: "",
    isActive: true,
  };
}

export function createEmptyRecipeAdditionalGroupState(
  position = 0,
): RecipeAdditionalGroupFormState {
  return {
    id: createId(),
    name: "",
    selectionType: "single",
    minSelections: "0",
    maxSelections: "1",
    position,
    notes: "",
    options: [createEmptyRecipeAdditionalOptionState()],
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
    additionalGroups: [],
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
        : formatMoneyInput(String(response.data.salePriceCents)),
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
    additionalGroups: response.data.additionalGroups.map((group) => ({
      id: group.id,
      name: group.name,
      selectionType: group.selectionType,
      minSelections: numberToString(group.minSelections),
      maxSelections: numberToString(group.maxSelections),
      position: group.position,
      notes: group.notes ?? "",
      options: group.options.map((option) => ({
        id: option.id,
        name: option.name,
        priceDelta:
          option.priceDeltaCents === 0
            ? ""
            : formatMoneyInput(String(option.priceDeltaCents)),
        position: option.position,
        notes: option.notes ?? "",
        isActive: true,
      })),
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

function adaptAdditionalGroups(groups: RecipeFormState["additionalGroups"]) {
  return groups
    .map((group, index) => ({
      name: group.name.trim(),
      selectionType: group.selectionType,
      minSelections: Math.max(0, Math.trunc(stringToNumber(group.minSelections))),
      maxSelections: Math.max(1, Math.trunc(stringToNumber(group.maxSelections))),
      position: group.position ?? index,
      notes: group.notes.trim() || null,
      options: group.options
        .filter((option) => option.isActive)
        .map((option, optionIndex) => ({
          name: option.name.trim(),
          priceDeltaCents: parseMoneyInputToCents(option.priceDelta) ?? 0,
          position: option.position ?? optionIndex,
          notes: option.notes.trim() || null,
        })),
    }))
    .filter((group) => group.name !== "" && group.options.length > 0);
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
        state.salePrice.trim() === "" ? null : parseMoneyInputToCents(state.salePrice),
      notes: state.notes.trim() || null,
      components: adaptComponents(state.components),
      additionalGroups:
        state.kind === "ProdutoVenda"
          ? adaptAdditionalGroups(state.additionalGroups)
          : [],
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
