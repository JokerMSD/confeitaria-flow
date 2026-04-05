import type { UpdateInventoryItemRequest } from "@shared/types";
import { useMutation } from "@tanstack/react-query";
import { updateInventoryItem } from "@/api/inventory-api";
import { invalidateOperationalData } from "@/lib/operational-query";

export function useUpdateInventoryItem() {
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateInventoryItemRequest;
    }) => updateInventoryItem(id, payload),
    onSuccess: async (_, variables) => {
      await invalidateOperationalData({
        inventoryItemId: variables.id,
      });
    },
  });
}
