import type { ListInventoryMovementsFilters } from "../types/inventory-api.types";

export const inventoryMovementQueryKeys = {
  all: ["inventory", "movements"] as const,
  list: (filters: ListInventoryMovementsFilters = {}) =>
    ["inventory", "movements", "list", filters] as const,
  byItem: (itemId: string) => ["inventory", "movements", "item", itemId] as const,
  item: (itemId: string) => ["inventory", "movements", "item", itemId] as const,
};
