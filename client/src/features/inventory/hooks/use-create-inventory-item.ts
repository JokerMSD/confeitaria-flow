import { useMutation } from "@tanstack/react-query";
import { createInventoryItem } from "@/api/inventory-api";
import { invalidateOperationalData } from "@/lib/operational-query";

export function useCreateInventoryItem() {
  return useMutation({
    mutationFn: createInventoryItem,
    onSuccess: async (response) => {
      await invalidateOperationalData({
        inventoryItemId: response.data.id,
      });
    },
  });
}
