import type {
  OrdersDashboardDrilldown,
  OrdersDashboardDrilldownFilters,
  OrdersDashboardSummary,
  OrdersDashboardSummaryFilters,
} from "./order-dashboard.types";

export interface OrdersDashboardSummaryResponse {
  data: OrdersDashboardSummary;
  filters: OrdersDashboardSummaryFilters;
}

export interface OrdersDashboardDrilldownResponse {
  data: OrdersDashboardDrilldown;
  filters: OrdersDashboardDrilldownFilters;
}
