import type { OrderStatus, UpdateOrderStatusRequest } from "@shared/types";
import { useMutation } from "@tanstack/react-query";
import { updateOrderStatus } from "@/api/orders-api";
import { invalidateOperationalData } from "@/lib/operational-query";

export function useUpdateOrderStatus() {
  return useMutation({
    mutationFn: ({
      id,
      status,
      lastKnownUpdatedAt,
    }: {
      id: string;
      status: OrderStatus;
      lastKnownUpdatedAt?: string | null;
    }) =>
      updateOrderStatus(id, {
        data: { status, lastKnownUpdatedAt },
      } satisfies UpdateOrderStatusRequest),
    onSuccess: async (response, variables) => {
      await invalidateOperationalData({
        orderId: variables.id,
        customerId: response.data.customerId ?? undefined,
      });
    },
  });
}
