import type { UpdateOrderRequest } from "@shared/types";
import { useMutation } from "@tanstack/react-query";
import { updateOrder } from "@/api/orders-api";
import { invalidateOperationalData } from "@/lib/operational-query";

export function useUpdateOrder() {
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateOrderRequest }) =>
      updateOrder(id, payload),
    onSuccess: async (response, variables) => {
      await invalidateOperationalData({
        orderId: variables.id,
        customerId: response.data.customerId ?? undefined,
      });
    },
  });
}
