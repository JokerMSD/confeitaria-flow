import type {
  OrdersDashboardSummary,
  OrdersDashboardSummaryFilters,
} from "./order-dashboard.types";

export interface OrdersDashboardSummaryResponse {
  data: OrdersDashboardSummary;
  filters: OrdersDashboardSummaryFilters;
}
