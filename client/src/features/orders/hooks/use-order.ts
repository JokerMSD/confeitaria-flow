import { useQuery } from "@tanstack/react-query";
import { getOrder } from "@/api/orders-api";
import { orderQueryKeys } from "../lib/order-query-keys";

export function useOrder(id: string | undefined) {
  return useQuery({
    queryKey: orderQueryKeys.detail(id ?? "unknown"),
    queryFn: () => getOrder(id!),
    enabled: Boolean(id),
  });
}
