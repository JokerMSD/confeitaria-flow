import type {
  CreateInventoryItemRequest,
  InventoryItemCategory as ApiInventoryCategory,
  InventoryItemDetailResponse,
  InventoryItemUnit as ApiInventoryUnit,
  UpdateInventoryItemRequest,
} from "@shared/types";
import type {
  InventoryFormState,
  UiInventoryCategory,
  UiInventoryUnit,
} from "../types/inventory-ui";

const uiToApiCategoryMap: Record<UiInventoryCategory, ApiInventoryCategory> = {
  "Produto Pronto": "ProdutoPronto",
  Ingrediente: "Ingrediente",
  Embalagem: "Embalagem",
};

const apiToUiCategoryMap: Record<ApiInventoryCategory, UiInventoryCategory> = {
  ProdutoPronto: "Produto Pronto",
  Ingrediente: "Ingrediente",
  Embalagem: "Embalagem",
};

function quantityStringToNumber(value: string) {
  const normalized = value.replace(",", ".").trim();

  if (!normalized) {
    return 0;
  }

  const quantity = Number.parseFloat(normalized);
  if (!Number.isFinite(quantity)) {
    return 0;
  }

  return quantity;
}

function numberToQuantityString(value: number) {
  return Number.isInteger(value) ? String(value) : String(value);
}

function centsToMoneyString(value: number | null | undefined) {
  if (value == null) {
    return "";
  }

  return (value / 100).toFixed(2);
}

function moneyStringToCents(value: string) {
  const normalized = value.replace(",", ".").trim();

  if (!normalized) {
    return null;
  }

  const amount = Number.parseFloat(normalized);
  if (!Number.isFinite(amount) || amount <= 0) {
    return null;
  }

  return Math.round(amount * 100);
}

export function createEmptyInventoryFormState(): InventoryFormState {
  return {
    name: "",
    category: "Ingrediente",
    currentQuantity: "",
    minQuantity: "0",
    unit: "un",
    recipeEquivalentQuantity: "",
    recipeEquivalentUnit: "g",
    purchaseUnitCost: "",
    notes: "",
  };
}

export function adaptInventoryItemDetailToFormState(
  response: InventoryItemDetailResponse,
): InventoryFormState {
  return {
    name: response.data.name,
    category: apiToUiCategoryMap[response.data.category],
    currentQuantity: numberToQuantityString(response.data.currentQuantity),
    minQuantity: numberToQuantityString(response.data.minQuantity),
    unit: response.data.unit as UiInventoryUnit,
    recipeEquivalentQuantity: numberToQuantityString(
      response.data.recipeEquivalentQuantity ?? 0,
    ).replace(/^0$/, response.data.recipeEquivalentQuantity == null ? "" : "0"),
    recipeEquivalentUnit:
      (response.data.recipeEquivalentUnit as UiInventoryUnit | null) ?? "g",
    purchaseUnitCost: centsToMoneyString(response.data.purchaseUnitCostCents),
    notes: response.data.notes ?? "",
  };
}

function adaptFormStateToInput(state: InventoryFormState) {
  return {
    name: state.name.trim(),
    category: uiToApiCategoryMap[state.category],
    currentQuantity: quantityStringToNumber(state.currentQuantity),
    minQuantity: quantityStringToNumber(state.minQuantity),
    unit: state.unit as ApiInventoryUnit,
    recipeEquivalentQuantity:
      state.category === "Ingrediente" &&
      (state.unit === "un" || state.unit === "caixa")
        ? quantityStringToNumber(state.recipeEquivalentQuantity) || null
        : null,
    recipeEquivalentUnit:
      state.category === "Ingrediente" &&
      (state.unit === "un" || state.unit === "caixa") &&
      state.recipeEquivalentQuantity.trim()
        ? (state.recipeEquivalentUnit as ApiInventoryUnit)
        : null,
    purchaseUnitCostCents:
      state.category === "Ingrediente"
        ? moneyStringToCents(state.purchaseUnitCost)
        : null,
    notes: state.notes.trim() || null,
  };
}

export function adaptInventoryFormStateToCreatePayload(
  state: InventoryFormState,
): CreateInventoryItemRequest {
  return {
    data: adaptFormStateToInput(state),
  };
}

export function adaptInventoryFormStateToUpdatePayload(
  state: InventoryFormState,
): UpdateInventoryItemRequest {
  return {
    data: adaptFormStateToInput(state),
  };
}
