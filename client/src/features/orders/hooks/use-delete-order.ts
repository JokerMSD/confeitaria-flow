import { useMutation } from "@tanstack/react-query";
import { deleteOrder } from "@/api/orders-api";

export function useDeleteOrder() {
  return useMutation({
    mutationFn: deleteOrder,
  });
}
