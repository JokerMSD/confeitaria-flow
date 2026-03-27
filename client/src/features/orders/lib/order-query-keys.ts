import type { ListOrdersFilters } from "@shared/types";

export const orderQueryKeys = {
  all: ["orders"] as const,
  list: (filters: ListOrdersFilters = {}) => ["orders", "list", filters] as const,
  detail: (id: string) => ["orders", "detail", id] as const,
  dashboardSummary: () => ["orders", "dashboard-summary"] as const,
};
