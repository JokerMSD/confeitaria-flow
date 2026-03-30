import type {
  CreateInventoryMovementInput,
  InventoryMovement as ApiInventoryMovement,
  InventoryMovementType as ApiInventoryMovementType,
} from "../types/inventory-api.types";
import type {
  InventoryMovementFormState,
  InventoryMovementListItem,
  UiInventoryUnit,
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
    purchaseDiscount: "",
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
    purchaseDiscount: "",
    purchaseEquivalentQuantity: "",
    purchasePaymentMethod: "Pix",
  };
}

function moneyStringToCents(value: string) {
  return parseMoneyInputToCents(value);
}

function isUnitPurchase(unit: UiInventoryUnit | undefined) {
  return unit === "un" || unit === "caixa";
}

export function resolveInventoryPurchaseAmountCents(
  state: InventoryMovementFormState,
) {
  if (!state.registerPurchase) {
    return null;
  }

  const amountCents = moneyStringToCents(state.purchaseAmount);

  return amountCents == null ? null : amountCents;
}

export function resolveInventoryPurchaseDiscountCents(
  state: InventoryMovementFormState,
) {
  if (!state.registerPurchase) {
    return null;
  }

  const amountCents = moneyStringToCents(state.purchaseDiscount);
  return amountCents == null ? null : amountCents;
}

export function resolveInventoryPurchaseTotalPreviewCents(
  state: InventoryMovementFormState,
  itemUnit?: UiInventoryUnit,
) {
  const amountCents = resolveInventoryPurchaseAmountCents(state);
  const discountCents = resolveInventoryPurchaseDiscountCents(state) ?? 0;

  if (amountCents == null) {
    return null;
  }

  const grossTotalCents = isUnitPurchase(itemUnit)
    ? Math.round(quantityStringToNumber(state.quantity) * amountCents)
    : amountCents;

  return Math.max(0, grossTotalCents - discountCents);
}

export function resolveInventoryPurchaseGrossPreviewCents(
  state: InventoryMovementFormState,
  itemUnit?: UiInventoryUnit,
) {
  const amountCents = resolveInventoryPurchaseAmountCents(state);

  if (amountCents == null) {
    return null;
  }

  if (isUnitPurchase(itemUnit)) {
    const quantity = quantityStringToNumber(state.quantity);
    return Math.round(quantity * amountCents);
  }

  return amountCents;
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
    purchaseAmountCents: resolveInventoryPurchaseAmountCents(state),
    purchaseDiscountCents: resolveInventoryPurchaseDiscountCents(state),
    purchaseEquivalentQuantity: state.purchaseEquivalentQuantity.trim()
      ? quantityStringToNumber(state.purchaseEquivalentQuantity)
      : null,
    purchasePaymentMethod: state.registerPurchase
      ? uiToApiPaymentMethodMap[state.purchasePaymentMethod]
      : null,
  };
}
