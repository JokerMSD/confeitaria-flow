export type UiInventoryCategory =
  | "Produto Pronto"
  | "Ingrediente"
  | "Embalagem";

export type UiInventoryUnit = "un" | "kg" | "g" | "l" | "ml" | "caixa";

export interface InventoryListItem {
  id: string;
  name: string;
  category: UiInventoryCategory;
  currentQuantity: number;
  minQuantity: number;
  unit: UiInventoryUnit;
  recipeEquivalentQuantity: number | null;
  recipeEquivalentUnit: UiInventoryUnit | null;
  notes: string;
  isLowStock: boolean;
}

export interface InventoryFormState {
  lastKnownUpdatedAt: string | null;
  name: string;
  category: UiInventoryCategory;
  currentQuantity: string;
  minQuantity: string;
  unit: UiInventoryUnit;
  recipeEquivalentQuantity: string;
  recipeEquivalentUnit: UiInventoryUnit;
  purchaseUnitCost: string;
  notes: string;
  confirmRecalibration: boolean;
  recalibrationReason: string;
}

export type UiInventoryMovementType = "Entrada" | "Saida" | "Ajuste";

export interface InventoryMovementListItem {
  id: string;
  itemId: string;
  type: UiInventoryMovementType;
  quantity: number;
  reason: string;
  reference: string;
  originKind: "Manual" | "Pedido" | "AjusteAutomatico" | "Compra" | "Sistema";
  originLabel: string;
  explanation: string;
  affectsCash: boolean;
  purchaseAmountCents: number | null;
  purchaseDiscountCents: number | null;
  purchasePaymentMethod:
    | "Pix"
    | "Dinheiro"
    | "Cartão de crédito"
    | "Cartão de débito"
    | "Transferência"
    | "";
  createdAt: string;
}

export interface InventoryMovementFormState {
  type: UiInventoryMovementType;
  quantity: string;
  reason: string;
  reference: string;
  registerPurchaseCost: boolean;
  registerCashExpense: boolean;
  purchaseAmount: string;
  purchaseDiscount: string;
  purchaseEquivalentQuantity: string;
  purchasePaymentMethod:
    | "Pix"
    | "Dinheiro"
    | "Cartão de crédito"
    | "Cartão de débito"
    | "Transferência";
}

export interface InventoryPurchasePlanSourceItem {
  orderId: string;
  orderNumber: string;
  customerName: string;
  deliveryDate: string;
  productName: string;
  quantity: number;
  usesLegacyRecipeResolution: boolean;
}

export interface InventoryPurchasePlanListItem {
  itemId: string;
  itemName: string;
  itemUnit: UiInventoryUnit;
  currentQuantity: number;
  requiredQuantity: number;
  deficitQuantity: number;
  suggestedPurchaseQuantity: number;
  estimatedPurchaseCost: number | null;
  sourceCount: number;
  sources: InventoryPurchasePlanSourceItem[];
}

export interface InventoryPurchasePlanView {
  pendingOrderCount: number;
  pendingOrderItemCount: number;
  shortageItemCount: number;
  estimatedPurchaseCost: number;
  hasItemsWithoutCost: boolean;
  items: InventoryPurchasePlanListItem[];
}
