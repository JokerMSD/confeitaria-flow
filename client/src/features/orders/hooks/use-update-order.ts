import type { UpdateOrderRequest } from "@shared/types";
import { useMutation } from "@tanstack/react-query";
import { updateOrder } from "@/api/orders-api";
import { queryClient } from "@/lib/queryClient";
import { cashQueryKeys } from "@/features/cash/lib/cash-query-keys";
import { inventoryQueryKeys } from "@/features/inventory/lib/inventory-query-keys";
import { orderQueryKeys } from "../lib/order-query-keys";

export function useUpdateOrder() {
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateOrderRequest }) =>
      updateOrder(id, payload),
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: orderQueryKeys.all,
        }),
        queryClient.invalidateQueries({
          queryKey: orderQueryKeys.detail(variables.id),
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
