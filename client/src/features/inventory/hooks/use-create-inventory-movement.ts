import { useMutation } from "@tanstack/react-query";
import { createInventoryMovement } from "@/api/inventory-api";
import { invalidateOperationalData } from "@/lib/operational-query";

export function useCreateInventoryMovement() {
  return useMutation({
    mutationFn: createInventoryMovement,
    onSuccess: async (_, variables) => {
      await invalidateOperationalData({
        inventoryItemId: variables.data.itemId,
      });
    },
  });
}
