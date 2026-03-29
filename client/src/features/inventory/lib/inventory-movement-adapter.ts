import type {
  CreateInventoryMovementInput,
  InventoryMovement as ApiInventoryMovement,
  InventoryMovementType as ApiInventoryMovementType,
} from "../types/inventory-api.types";
import type {
  InventoryMovementFormState,
  InventoryMovementListItem,
  UiInventoryMovementType,
} from "../types/inventory-ui";

const apiToUiTypeMap: Record<ApiInventoryMovementType, UiInventoryMovementType> = {
  Entrada: "Entrada",
  Saida: "Saída",
  Ajuste: "Ajuste",
};

const uiToApiTypeMap: Record<UiInventoryMovementType, ApiInventoryMovementType> = {
  Entrada: "Entrada",
  "Saída": "Saida",
  Ajuste: "Ajuste",
};

function numberToQuantityString(value: number) {
  return Number.isInteger(value) ? String(value) : String(value);
}

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

export function createEmptyInventoryMovementFormState(): InventoryMovementFormState {
  return {
    type: "Entrada",
    quantity: "",
    reason: "",
    reference: "",
    registerPurchase: false,
    purchaseAmount: "",
    purchasePaymentMethod: "Pix",
  };
}

export function adaptInventoryMovementToListItem(
  movement: ApiInventoryMovement,
): InventoryMovementListItem {
  return {
    id: movement.id,
    itemId: movement.itemId,
    type: apiToUiTypeMap[movement.type],
    quantity: movement.quantity,
    reason: movement.reason ?? "",
    reference: movement.reference ?? "",
    createdAt: movement.createdAt,
  };
}

export function adaptInventoryMovementsToList(items: ApiInventoryMovement[]) {
  return items.map(adaptInventoryMovementToListItem);
}

export function adaptInventoryMovementToFormState(
  movement: ApiInventoryMovement,
): InventoryMovementFormState {
  return {
    type: apiToUiTypeMap[movement.type],
    quantity: numberToQuantityString(Math.abs(movement.quantity)),
    reason: movement.reason ?? "",
    reference: movement.reference ?? "",
    registerPurchase: false,
    purchaseAmount: "",
    purchasePaymentMethod: "Pix",
  };
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

const uiToApiPaymentMethodMap = {
  Pix: "Pix",
  Dinheiro: "Dinheiro",
  "Cartão de crédito": "CartaoCredito",
  "Cartão de débito": "CartaoDebito",
  Transferência: "Transferencia",
} as const;

export function adaptInventoryMovementFormStateToCreatePayload(
  itemId: string,
  state: InventoryMovementFormState,
): CreateInventoryMovementInput {
  return {
    itemId,
    type: uiToApiTypeMap[state.type],
    quantity: quantityStringToNumber(state.quantity),
    reason: state.reason.trim(),
    reference: state.reference.trim() || null,
    purchaseAmountCents: state.registerPurchase
      ? moneyStringToCents(state.purchaseAmount)
      : null,
    purchasePaymentMethod: state.registerPurchase
      ? uiToApiPaymentMethodMap[state.purchasePaymentMethod]
      : null,
  };
}
