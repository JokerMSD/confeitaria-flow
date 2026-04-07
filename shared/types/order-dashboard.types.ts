export interface OrdersDashboardSummaryFilters {
  dateFrom?: string;
  dateTo?: string;
}

export type OrdersDashboardDrilldownKind =
  | "today"
  | "overdue"
  | "cancelled"
  | "receivable"
  | "units-sold"
  | "estimated-profit"
  | "top-selling-product"
  | "most-profitable-product";

export interface OrdersDashboardDrilldownFilters
  extends OrdersDashboardSummaryFilters {
  kind: OrdersDashboardDrilldownKind;
  recipeId?: string;
  productName?: string;
}

export interface OrdersDashboardProductMetric {
  recipeId: string | null;
  productName: string;
  quantitySold: number;
  orderCount: number;
  revenueCents: number;
  estimatedCostCents: number | null;
  estimatedProfitCents: number | null;
  hasEstimatedCost: boolean;
}

export interface OrdersDashboardDeliveryModeMetric {
  deliveryMode: "Entrega" | "Retirada";
  orderCount: number;
  revenueCents: number;
}

export interface OrdersDashboardProductHighlight {
  productName: string;
  quantitySold?: number;
  revenueCents?: number;
  estimatedProfitCents?: number | null;
}

export interface OrdersDashboardSummary {
  period: {
    dateFrom: string;
    dateTo: string;
  };
  totals: {
    ordersCount: number;
    itemLinesCount: number;
    unitsSold: number;
    revenueCents: number;
    estimatedProfitCents: number;
    productsWithoutEstimatedCostCount: number;
  };
  highlights: {
    topSellingProduct: OrdersDashboardProductHighlight | null;
    mostProfitableProduct: OrdersDashboardProductHighlight | null;
  };
  products: OrdersDashboardProductMetric[];
  deliveryModes: OrdersDashboardDeliveryModeMetric[];
}

export interface OrdersDashboardDrilldownOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  deliveryDate: string;
  deliveryTime: string | null;
  status: string;
  paymentStatus: string;
  subtotalAmountCents: number;
  itemCount: number;
  deliveryMode: "Entrega" | "Retirada";
  itemSummary: string;
}

export interface OrdersDashboardDrilldown {
  title: string;
  description: string;
  filters: OrdersDashboardDrilldownFilters;
  totalOrders: number;
  orders: OrdersDashboardDrilldownOrder[];
}
