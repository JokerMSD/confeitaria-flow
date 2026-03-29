import { useMutation } from "@tanstack/react-query";
import { deleteInventoryItem } from "@/api/inventory-api";
import { queryClient } from "@/lib/queryClient";
import { inventoryQueryKeys } from "../lib/inventory-query-keys";

export function useDeleteInventoryItem() {
  return useMutation({
    mutationFn: deleteInventoryItem,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: inventoryQueryKeys.all,
      });
    },
  });
}
