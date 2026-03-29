import type { UpdateOrderRequest } from "@shared/types";
import { useMutation } from "@tanstack/react-query";
import { updateOrder } from "@/api/orders-api";
import { queryClient } from "@/lib/queryClient";
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
      ]);
    },
  });
}
