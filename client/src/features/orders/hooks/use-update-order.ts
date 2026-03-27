import type { UpdateOrderRequest } from "@shared/types";
import { useMutation } from "@tanstack/react-query";
import { updateOrder } from "@/api/orders-api";

export function useUpdateOrder() {
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateOrderRequest }) =>
      updateOrder(id, payload),
  });
}
