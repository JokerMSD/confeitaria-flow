import type { PaymentMethod } from "./order-item.types";

export type InventoryItemCategory = "ProdutoPronto" | "Ingrediente" | "Embalagem";

export type InventoryItemUnit = "un" | "kg" | "g" | "l" | "ml" | "caixa";

export type InventoryMovementType = "Entrada" | "Saida" | "Ajuste";

export interface InventoryItem {
  id: string;
  name: string;
  category: InventoryItemCategory;
  currentQuantity: number;
  minQuantity: number;
  unit: InventoryItemUnit;
  purchaseUnitCostCents: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreateInventoryItemInput {
  name: string;
  category: InventoryItemCategory;
  currentQuantity: number;
  minQuantity: number;
  unit: InventoryItemUnit;
  purchaseUnitCostCents?: number | null;
  notes?: string | null;
}

export interface UpdateInventoryItemInput extends CreateInventoryItemInput {}

export interface ListInventoryItemsFilters {
  search?: string;
  category?: InventoryItemCategory;
}

export interface InventoryMovement {
  id: string;
  itemId: string;
  type: InventoryMovementType;
  quantity: number;
  reason: string;
  reference: string | null;
  createdAt: string;
}

export interface CreateInventoryMovementInput {
  itemId: string;
  type: InventoryMovementType;
  quantity: number;
  reason: string;
  reference?: string | null;
  purchaseAmountCents?: number | null;
  purchasePaymentMethod?: PaymentMethod | null;
}

export interface ListInventoryMovementsFilters {
  itemId?: string;
  type?: InventoryMovementType;
}
