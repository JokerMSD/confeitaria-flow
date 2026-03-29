import type { UpdateInventoryItemRequest } from "@shared/types";
import { useMutation } from "@tanstack/react-query";
import { updateInventoryItem } from "@/api/inventory-api";
import { queryClient } from "@/lib/queryClient";
import { inventoryQueryKeys } from "../lib/inventory-query-keys";

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
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: inventoryQueryKeys.all,
        }),
        queryClient.invalidateQueries({
          queryKey: inventoryQueryKeys.detail(variables.id),
        }),
      ]);
    },
  });
}
