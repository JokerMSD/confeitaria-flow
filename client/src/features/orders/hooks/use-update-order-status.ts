import type { OrderStatus, UpdateOrderStatusRequest } from "@shared/types";
import { useMutation } from "@tanstack/react-query";
import { updateOrderStatus } from "@/api/orders-api";
import { cashQueryKeys } from "@/features/cash/lib/cash-query-keys";
import { inventoryQueryKeys } from "@/features/inventory/lib/inventory-query-keys";
import { queryClient } from "@/lib/queryClient";
import { orderQueryKeys } from "../lib/order-query-keys";

export function useUpdateOrderStatus() {
  return useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: OrderStatus;
    }) =>
      updateOrderStatus(id, {
        data: { status },
      } satisfies UpdateOrderStatusRequest),
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: orderQueryKeys.all }),
        queryClient.invalidateQueries({
          queryKey: orderQueryKeys.detail(variables.id),
        }),
        queryClient.invalidateQueries({ queryKey: orderQueryKeys.queue() }),
        queryClient.invalidateQueries({ queryKey: cashQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: inventoryQueryKeys.all }),
      ]);
    },
  });
}
