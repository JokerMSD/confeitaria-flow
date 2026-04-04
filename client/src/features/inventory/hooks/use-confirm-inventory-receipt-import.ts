import { useMutation } from "@tanstack/react-query";
import { confirmInventoryReceiptImport } from "@/api/inventory-api";
import { queryClient } from "@/lib/queryClient";
import { inventoryQueryKeys } from "../lib/inventory-query-keys";
import { inventoryMovementQueryKeys } from "../lib/inventory-movement-query-keys";
import { cashQueryKeys } from "@/features/cash/lib/cash-query-keys";

export function useConfirmInventoryReceiptImport() {
  return useMutation({
    mutationFn: confirmInventoryReceiptImport,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: inventoryQueryKeys.all }),
        queryClient.invalidateQueries({
          queryKey: inventoryQueryKeys.purchasePlan(),
        }),
        queryClient.invalidateQueries({
          queryKey: inventoryMovementQueryKeys.all,
        }),
        queryClient.invalidateQueries({ queryKey: cashQueryKeys.all }),
      ]);
    },
  });
}
