import { useQuery } from "@tanstack/react-query";
import { getOrdersQueue } from "@/api/orders-api";
import { operationalQueryOptions } from "@/lib/operational-query";
import { orderQueryKeys } from "../lib/order-query-keys";

export function useOrdersQueue() {
  return useQuery({
    queryKey: orderQueryKeys.queue(),
    queryFn: () => getOrdersQueue(),
    ...operationalQueryOptions,
  });
}
