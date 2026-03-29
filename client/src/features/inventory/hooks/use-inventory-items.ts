import type { ListInventoryItemsFilters } from "@shared/types";
import { useQuery } from "@tanstack/react-query";
import { listInventoryItems } from "@/api/inventory-api";
import { inventoryQueryKeys } from "../lib/inventory-query-keys";

export function useInventoryItems(filters: ListInventoryItemsFilters = {}) {
  return useQuery({
    queryKey: inventoryQueryKeys.list(filters),
    queryFn: () => listInventoryItems(filters),
  });
}
