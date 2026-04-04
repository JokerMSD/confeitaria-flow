import type { PaymentMethod } from "./order-item.types";

export type InventoryItemCategory = "ProdutoPronto" | "Ingrediente" | "Embalagem";

export type InventoryItemUnit = "un" | "kg" | "g" | "l" | "ml" | "caixa";

export type InventoryMovementType = "Entrada" | "Saida" | "Ajuste";
export type InventoryMovementOriginKind =
  | "Manual"
  | "Pedido"
  | "AjusteAutomatico"
  | "Compra"
  | "Sistema";

export interface InventoryItem {
  id: string;
  name: string;
  category: InventoryItemCategory;
  currentQuantity: number;
  minQuantity: number;
  unit: InventoryItemUnit;
  recipeEquivalentQuantity: number | null;
  recipeEquivalentUnit: InventoryItemUnit | null;
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
  recipeEquivalentQuantity?: number | null;
  recipeEquivalentUnit?: InventoryItemUnit | null;
  purchaseUnitCostCents?: number | null;
  notes?: string | null;
}

export interface UpdateInventoryItemInput extends CreateInventoryItemInput {
  lastKnownUpdatedAt?: string | null;
  confirmRecalibration?: boolean;
  recalibrationReason?: string | null;
}

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
  purchaseAmountCents: number | null;
  purchaseDiscountCents: number | null;
  purchasePaymentMethod: PaymentMethod | null;
  purchaseEquivalentQuantity: number | null;
  purchaseEquivalentUnit: InventoryItemUnit | null;
  sourceType: string | null;
  sourceId: string | null;
  isSystemGenerated: boolean;
  originKind: InventoryMovementOriginKind;
  originLabel: string;
  explanation: string;
  affectsCash: boolean;
  createdAt: string;
}

export interface CreateInventoryMovementInput {
  itemId: string;
  type: InventoryMovementType;
  quantity: number;
  reason: string;
  reference?: string | null;
  purchaseAmountCents?: number | null;
  purchaseDiscountCents?: number | null;
  purchasePaymentMethod?: PaymentMethod | null;
  purchaseEquivalentQuantity?: number | null;
}

export interface ListInventoryMovementsFilters {
  itemId?: string;
  type?: InventoryMovementType;
}

export interface InventoryPurchasePlanSource {
  orderId: string;
  orderNumber: string;
  customerName: string;
  deliveryDate: string;
  productName: string;
  quantity: number;
  usesLegacyRecipeResolution: boolean;
}

export interface InventoryPurchasePlanItem {
  itemId: string;
  itemName: string;
  itemUnit: InventoryItemUnit;
  currentQuantity: number;
  requiredQuantity: number;
  deficitQuantity: number;
  suggestedPurchaseQuantity: number;
  purchaseUnitCostCents: number | null;
  estimatedPurchaseCostCents: number | null;
  sourceCount: number;
  sources: InventoryPurchasePlanSource[];
}

export interface InventoryPurchasePlan {
  pendingOrderCount: number;
  pendingOrderItemCount: number;
  shortageItemCount: number;
  estimatedPurchaseCostCents: number;
  hasItemsWithoutCost: boolean;
  items: InventoryPurchasePlanItem[];
}

export interface InventoryReceiptImportInput {
  fileName: string;
  mimeType: "image/jpeg" | "image/png" | "image/webp";
  contentBase64: string;
}

export interface InventoryReceiptImportMatch {
  itemId: string;
  itemName: string;
  itemUnit: InventoryItemUnit;
  score: number;
}

export interface InventoryReceiptImportSuggestedLine {
  lineId: string;
  rawText: string;
  normalizedDescription: string;
  quantity: number;
  totalAmountCents: number | null;
  suggestedItemId: string | null;
  matches: InventoryReceiptImportMatch[];
}

export interface InventoryReceiptImportAnalysis {
  extractedText: string;
  lines: InventoryReceiptImportSuggestedLine[];
  skippedLineCount: number;
}

export interface ConfirmInventoryReceiptImportLineInput {
  lineId: string;
  itemId: string;
  quantity: number;
  totalAmountCents: number | null;
  rawText: string;
}

export interface ConfirmInventoryReceiptImportInput {
  fileName: string;
  reference?: string | null;
  registerCashExpense?: boolean;
  paymentMethod?: PaymentMethod | null;
  lines: ConfirmInventoryReceiptImportLineInput[];
}
