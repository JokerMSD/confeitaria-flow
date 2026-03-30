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
  notes: string;
  isLowStock: boolean;
}

export interface InventoryFormState {
  name: string;
  category: UiInventoryCategory;
  currentQuantity: string;
  minQuantity: string;
  unit: UiInventoryUnit;
  recipeEquivalentQuantity: string;
  recipeEquivalentUnit: UiInventoryUnit;
  purchaseUnitCost: string;
  notes: string;
}

export type UiInventoryMovementType = "Entrada" | "Saída" | "Ajuste";

export interface InventoryMovementListItem {
  id: string;
  itemId: string;
  type: UiInventoryMovementType;
  quantity: number;
  reason: string;
  reference: string;
  createdAt: string;
}

export interface InventoryMovementFormState {
  type: UiInventoryMovementType;
  quantity: string;
  reason: string;
  reference: string;
  registerPurchase: boolean;
  purchaseAmount: string;
  purchasePaymentMethod:
    | "Pix"
    | "Dinheiro"
    | "Cartão de crédito"
    | "Cartão de débito"
    | "Transferência";
}
