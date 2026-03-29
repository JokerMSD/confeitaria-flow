import type {
  CreateInventoryItemRequest,
  DeleteInventoryItemResponse,
  InventoryItemDetailResponse,
  ListInventoryItemsFilters,
  ListInventoryItemsResponse,
  UpdateInventoryItemRequest,
} from "@shared/types";
import { httpClient } from "./http-client";
import type {
  CreateInventoryMovementRequest,
  InventoryMovementDetailResponse,
  ListInventoryMovementsFilters,
  ListInventoryMovementsResponse,
} from "@/features/inventory/types/inventory-api.types";

function buildInventoryItemsQuery(filters: ListInventoryItemsFilters = {}) {
  const params = new URLSearchParams();

  if (filters.search) params.set("search", filters.search);
  if (filters.category) params.set("category", filters.category);

  const query = params.toString();
  return query ? `/api/inventory-items?${query}` : "/api/inventory-items";
}

export function listInventoryItems(filters: ListInventoryItemsFilters = {}) {
  return httpClient<ListInventoryItemsResponse>(buildInventoryItemsQuery(filters));
}

export function getInventoryItem(id: string) {
  return httpClient<InventoryItemDetailResponse>(`/api/inventory-items/${id}`);
}

export function createInventoryItem(payload: CreateInventoryItemRequest) {
  return httpClient<InventoryItemDetailResponse>("/api/inventory-items", {
    method: "POST",
    body: payload,
  });
}

export function updateInventoryItem(
  id: string,
  payload: UpdateInventoryItemRequest,
) {
  return httpClient<InventoryItemDetailResponse>(`/api/inventory-items/${id}`, {
    method: "PUT",
    body: payload,
  });
}

export function deleteInventoryItem(id: string) {
  return httpClient<DeleteInventoryItemResponse>(`/api/inventory-items/${id}`, {
    method: "DELETE",
  });
}

function buildInventoryMovementsQuery(filters: ListInventoryMovementsFilters = {}) {
  const params = new URLSearchParams();

  if (filters.itemId) params.set("itemId", filters.itemId);
  if (filters.type) params.set("type", filters.type);

  const query = params.toString();
  return query ? `/api/inventory-movements?${query}` : "/api/inventory-movements";
}

export function listInventoryMovements(
  filters: ListInventoryMovementsFilters = {},
) {
  return httpClient<ListInventoryMovementsResponse>(
    buildInventoryMovementsQuery(filters),
  );
}

export function getInventoryMovement(id: string) {
  return httpClient<InventoryMovementDetailResponse>(`/api/inventory-movements/${id}`);
}

export function createInventoryMovement(payload: CreateInventoryMovementRequest) {
  return httpClient<InventoryMovementDetailResponse>("/api/inventory-movements", {
    method: "POST",
    body: payload,
  });
}
