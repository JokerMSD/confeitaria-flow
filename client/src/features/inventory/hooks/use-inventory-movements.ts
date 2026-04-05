import type { ListInventoryMovementsFilters } from "../types/inventory-api.types";
import { useQuery } from "@tanstack/react-query";
import { listInventoryMovements } from "@/api/inventory-api";
import { operationalQueryOptions } from "@/lib/operational-query";
import { inventoryMovementQueryKeys } from "../lib/inventory-movement-query-keys";

export function useInventoryMovements(
  filters: ListInventoryMovementsFilters = {},
) {
  return useQuery({
    queryKey: inventoryMovementQueryKeys.list(filters),
    queryFn: () => listInventoryMovements(filters),
    ...operationalQueryOptions,
  });
}
