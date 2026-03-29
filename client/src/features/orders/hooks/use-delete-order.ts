import { useMutation } from "@tanstack/react-query";
import { deleteOrder } from "@/api/orders-api";
import { queryClient } from "@/lib/queryClient";
import { orderQueryKeys } from "../lib/order-query-keys";

export function useDeleteOrder() {
  return useMutation({
    mutationFn: deleteOrder,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: orderQueryKeys.all,
      });
    },
  });
}
