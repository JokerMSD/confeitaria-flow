import { useQuery } from "@tanstack/react-query";
import { getInventoryItem } from "@/api/inventory-api";
import { inventoryQueryKeys } from "../lib/inventory-query-keys";

export function useInventoryItem(id: string | undefined) {
  return useQuery({
    queryKey: inventoryQueryKeys.detail(id ?? "unknown"),
    queryFn: () => getInventoryItem(id!),
    enabled: Boolean(id),
  });
}
