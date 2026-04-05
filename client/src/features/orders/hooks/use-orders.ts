import type { ListOrdersFilters } from "@shared/types";
import { useQuery } from "@tanstack/react-query";
import { listOrders } from "@/api/orders-api";
import { operationalQueryOptions } from "@/lib/operational-query";
import { orderQueryKeys } from "../lib/order-query-keys";

export function useOrders(filters: ListOrdersFilters = {}) {
  return useQuery({
    queryKey: orderQueryKeys.list(filters),
    queryFn: () => listOrders(filters),
    ...operationalQueryOptions,
  });
}
