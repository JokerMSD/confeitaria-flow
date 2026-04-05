import type { OrdersDashboardSummaryFilters } from "@shared/types";
import { useQuery } from "@tanstack/react-query";
import { getOrdersDashboardSummary } from "@/api/orders-api";
import { operationalQueryOptions } from "@/lib/operational-query";
import { orderQueryKeys } from "../lib/order-query-keys";

export function useOrdersDashboardSummary(
  filters: OrdersDashboardSummaryFilters = {},
) {
  return useQuery({
    queryKey: orderQueryKeys.dashboardSummary(filters),
    queryFn: () => getOrdersDashboardSummary(filters),
    ...operationalQueryOptions,
  });
}
