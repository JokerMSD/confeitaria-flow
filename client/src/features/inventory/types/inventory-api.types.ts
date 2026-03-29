export type InventoryMovementType = "Entrada" | "Saida" | "Ajuste";

export interface InventoryMovement {
  id: string;
  itemId: string;
  type: InventoryMovementType;
  quantity: number;
  reason: string | null;
  reference: string | null;
  createdAt: string;
}

export interface ListInventoryMovementsFilters {
  itemId?: string;
  type?: InventoryMovementType;
}

export interface ListInventoryMovementsResponse {
  data: InventoryMovement[];
  filters: ListInventoryMovementsFilters;
}

export interface CreateInventoryMovementInput {
  itemId: string;
  type: InventoryMovementType;
  quantity: number;
  reason: string;
  reference?: string | null;
  purchaseAmountCents?: number | null;
  purchasePaymentMethod?:
    | "Pix"
    | "Dinheiro"
    | "CartaoCredito"
    | "CartaoDebito"
    | "Transferencia"
    | null;
}

export interface CreateInventoryMovementRequest {
  data: CreateInventoryMovementInput;
}

export interface InventoryMovementDetailResponse {
  data: InventoryMovement;
}
