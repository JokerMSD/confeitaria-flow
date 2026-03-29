import { useMutation } from "@tanstack/react-query";
import { createOrder } from "@/api/orders-api";
import { queryClient } from "@/lib/queryClient";
import { orderQueryKeys } from "../lib/order-query-keys";

export function useCreateOrder() {
  return useMutation({
    mutationFn: createOrder,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: orderQueryKeys.all,
      });
    },
  });
}
