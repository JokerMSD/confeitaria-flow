import type { OrdersDashboardDrilldownFilters } from "@shared/types";
import { useQuery } from "@tanstack/react-query";
import { getOrdersDashboardDrilldown } from "@/api/orders-api";

export function useOrdersDashboardDrilldown(
  filters: OrdersDashboardDrilldownFilters | null,
) {
  return useQuery({
    queryKey: ["orders", "dashboard-drilldown", filters],
    queryFn: () => getOrdersDashboardDrilldown(filters!),
    enabled: Boolean(filters),
  });
}
