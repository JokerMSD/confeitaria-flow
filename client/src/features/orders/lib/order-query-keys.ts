import type { ListOrdersFilters, OrdersDashboardSummaryFilters } from "@shared/types";

export const orderQueryKeys = {
  all: ["orders"] as const,
  list: (filters: ListOrdersFilters = {}) => ["orders", "list", filters] as const,
  detail: (id: string) => ["orders", "detail", id] as const,
  lookup: () => ["orders", "lookup"] as const,
  queue: () => ["orders", "queue"] as const,
  dashboardSummary: (filters: OrdersDashboardSummaryFilters = {}) =>
    ["orders", "dashboard-summary", filters] as const,
};
