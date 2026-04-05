import { useMutation } from "@tanstack/react-query";
import { createOrder } from "@/api/orders-api";
import { invalidateOperationalData } from "@/lib/operational-query";

export function useCreateOrder() {
  return useMutation({
    mutationFn: createOrder,
    onSuccess: async (response) => {
      await invalidateOperationalData({
        orderId: response.data.id,
        customerId: response.data.customerId ?? undefined,
      });
    },
  });
}
