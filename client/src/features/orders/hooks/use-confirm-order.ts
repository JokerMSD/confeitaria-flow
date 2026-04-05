import { useMutation } from "@tanstack/react-query";
import { confirmOrder } from "@/api/orders-api";
import { invalidateOperationalData } from "@/lib/operational-query";

export function useConfirmOrder() {
  return useMutation({
    mutationFn: (id: string) => confirmOrder(id),
    onSuccess: async (response, id) => {
      await invalidateOperationalData({
        orderId: id,
        customerId: response.data.customerId ?? undefined,
      });
    },
  });
}
