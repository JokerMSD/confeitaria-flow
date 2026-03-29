import { useMutation } from "@tanstack/react-query";
import { createInventoryItem } from "@/api/inventory-api";
import { queryClient } from "@/lib/queryClient";
import { inventoryQueryKeys } from "../lib/inventory-query-keys";

export function useCreateInventoryItem() {
  return useMutation({
    mutationFn: createInventoryItem,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: inventoryQueryKeys.all,
      });
    },
  });
}
