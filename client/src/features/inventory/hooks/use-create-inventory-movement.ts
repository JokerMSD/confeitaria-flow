import { useMutation } from "@tanstack/react-query";
import { createInventoryMovement } from "@/api/inventory-api";
import { queryClient } from "@/lib/queryClient";
import { inventoryQueryKeys } from "../lib/inventory-query-keys";
import { inventoryMovementQueryKeys } from "../lib/inventory-movement-query-keys";

export function useCreateInventoryMovement() {
  return useMutation({
    mutationFn: createInventoryMovement,
    onSuccess: (_, variables) => {
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: inventoryQueryKeys.all }),
        queryClient.invalidateQueries({
          queryKey: inventoryQueryKeys.purchasePlan(),
        }),
        queryClient.invalidateQueries({ queryKey: inventoryMovementQueryKeys.all }),
        queryClient.invalidateQueries({
          queryKey: inventoryMovementQueryKeys.item(variables.data.itemId),
        }),
      ]);
    },
  });
}
