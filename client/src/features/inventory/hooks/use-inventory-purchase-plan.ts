import { useQuery } from "@tanstack/react-query";
import { getInventoryPurchasePlan } from "@/api/inventory-api";
import { inventoryQueryKeys } from "../lib/inventory-query-keys";

export function useInventoryPurchasePlan() {
  return useQuery({
    queryKey: inventoryQueryKeys.purchasePlan(),
    queryFn: () => getInventoryPurchasePlan(),
  });
}
