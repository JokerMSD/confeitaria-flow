import { useMutation } from "@tanstack/react-query";
import { deleteOrder } from "@/api/orders-api";
import { invalidateOperationalData } from "@/lib/operational-query";

export function useDeleteOrder() {
  return useMutation({
    mutationFn: deleteOrder,
    onSuccess: async () => {
      await invalidateOperationalData();
    },
  });
}
