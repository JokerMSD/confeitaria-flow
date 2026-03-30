import { useMutation } from "@tanstack/react-query";
import { confirmOrder } from "@/api/orders-api";
import { queryClient } from "@/lib/queryClient";
import { cashQueryKeys } from "@/features/cash/lib/cash-query-keys";
import { inventoryQueryKeys } from "@/features/inventory/lib/inventory-query-keys";
import { orderQueryKeys } from "../lib/order-query-keys";

export function useConfirmOrder() {
  return useMutation({
    mutationFn: (id: string) => confirmOrder(id),
    onSuccess: async (_, id) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: orderQueryKeys.all,
        }),
        queryClient.invalidateQueries({
          queryKey: orderQueryKeys.detail(id),
        }),
        queryClient.invalidateQueries({
          queryKey: orderQueryKeys.queue(),
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
