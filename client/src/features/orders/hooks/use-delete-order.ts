import { useMutation } from "@tanstack/react-query";
import { deleteOrder } from "@/api/orders-api";
import { queryClient } from "@/lib/queryClient";
import { cashQueryKeys } from "@/features/cash/lib/cash-query-keys";
import { inventoryQueryKeys } from "@/features/inventory/lib/inventory-query-keys";
import { orderQueryKeys } from "../lib/order-query-keys";

export function useDeleteOrder() {
  return useMutation({
    mutationFn: deleteOrder,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: orderQueryKeys.all,
        }),
        queryClient.invalidateQueries({
          queryKey: cashQueryKeys.all,
        }),
        queryClient.invalidateQueries({
          queryKey: inventoryQueryKeys.all,
        }),
      ]);
    },
  });
}
