import type { ListInventoryItemsFilters } from "@shared/types";
import type { ListInventoryMovementsFilters } from "../types/inventory-api.types";

export const inventoryQueryKeys = {
  all: ["inventory-items"] as const,
  list: (filters: ListInventoryItemsFilters = {}) =>
    ["inventory-items", "list", filters] as const,
  detail: (id: string) => ["inventory-items", "detail", id] as const,
  movements: {
    all: ["inventory-movements"] as const,
    list: (filters: ListInventoryMovementsFilters = {}) =>
      ["inventory-movements", "list", filters] as const,
    item: (itemId: string) => ["inventory-movements", "item", itemId] as const,
  },
};
