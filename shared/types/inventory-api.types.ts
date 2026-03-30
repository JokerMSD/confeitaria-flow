import type {
  CreateInventoryItemInput,
  CreateInventoryMovementInput,
  InventoryItem,
  InventoryMovement,
  InventoryPurchasePlan,
  ListInventoryItemsFilters,
  ListInventoryMovementsFilters,
  UpdateInventoryItemInput,
} from "./inventory.types";

export interface ListInventoryItemsResponse {
  data: InventoryItem[];
  filters: ListInventoryItemsFilters;
}

export interface InventoryItemDetailResponse {
  data: InventoryItem;
}

export interface CreateInventoryItemRequest {
  data: CreateInventoryItemInput;
}

export interface UpdateInventoryItemRequest {
  data: UpdateInventoryItemInput;
}

export interface DeleteInventoryItemResponse {
  data: {
    id: string;
    deletedAt: string;
  };
}

export interface ListInventoryMovementsResponse {
  data: InventoryMovement[];
  filters: ListInventoryMovementsFilters;
}

export interface CreateInventoryMovementRequest {
  data: CreateInventoryMovementInput;
}

export interface CreateInventoryMovementResponse {
  data: InventoryMovement;
}

export interface InventoryMovementDetailResponse {
  data: InventoryMovement;
}

export interface InventoryPurchasePlanResponse {
  data: InventoryPurchasePlan;
}
