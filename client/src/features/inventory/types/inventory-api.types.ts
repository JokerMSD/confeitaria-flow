export type InventoryMovementType = "Entrada" | "Saida" | "Ajuste";

export interface InventoryMovement {
  id: string;
  itemId: string;
  type: InventoryMovementType;
  quantity: number;
  reason: string | null;
  reference: string | null;
  purchaseAmountCents: number | null;
  purchaseDiscountCents: number | null;
  purchasePaymentMethod:
    | "Pix"
    | "Dinheiro"
    | "CartaoCredito"
    | "CartaoDebito"
    | "Transferencia"
    | null;
  purchaseEquivalentQuantity: number | null;
  purchaseEquivalentUnit:
    | "un"
    | "kg"
    | "g"
    | "l"
    | "ml"
    | "caixa"
    | null;
  sourceType: string | null;
  sourceId: string | null;
  isSystemGenerated: boolean;
  originKind:
    | "Manual"
    | "Pedido"
    | "AjusteAutomatico"
    | "Compra"
    | "Sistema";
  originLabel: string;
  explanation: string;
  affectsCash: boolean;
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
  purchaseDiscountCents?: number | null;
  purchaseEquivalentQuantity?: number | null;
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
