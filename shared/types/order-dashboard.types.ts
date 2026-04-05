export interface OrdersDashboardSummaryFilters {
  dateFrom?: string;
  dateTo?: string;
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
