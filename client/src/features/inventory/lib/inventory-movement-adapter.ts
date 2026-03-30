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
import {
  parseDecimalInput,
  parseMoneyInputToCents,
} from "./inventory-input-helpers";

const apiToUiTypeMap: Record<ApiInventoryMovementType, UiInventoryMovementType> = {
  Entrada: "Entrada",
  Saida: "Saida",
  Ajuste: "Ajuste",
};

const uiToApiTypeMap: Record<UiInventoryMovementType, ApiInventoryMovementType> = {
  Entrada: "Entrada",
  Saida: "Saida",
  Ajuste: "Ajuste",
};

function numberToQuantityString(value: number) {
  return Number.isInteger(value) ? String(value) : String(value);
}

function quantityStringToNumber(value: string) {
  return parseDecimalInput(value);
}

export function createEmptyInventoryMovementFormState(): InventoryMovementFormState {
  return {
    type: "Entrada",
    quantity: "",
    reason: "",
    reference: "",
    registerPurchase: false,
    purchaseAmount: "",
    purchaseEquivalentQuantity: "",
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
    purchaseEquivalentQuantity: "",
    purchasePaymentMethod: "Pix",
  };
}

function moneyStringToCents(value: string) {
  return parseMoneyInputToCents(value);
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
    purchaseEquivalentQuantity: state.purchaseEquivalentQuantity.trim()
      ? quantityStringToNumber(state.purchaseEquivalentQuantity)
      : null,
    purchasePaymentMethod: state.registerPurchase
      ? uiToApiPaymentMethodMap[state.purchasePaymentMethod]
      : null,
  };
}
