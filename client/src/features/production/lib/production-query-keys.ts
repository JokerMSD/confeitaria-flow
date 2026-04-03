export const productionQueryKeys = {
  forecast: (filters: { deliveryDate?: string; dateFrom?: string; dateTo?: string }) =>
    [
      "production",
      "forecast",
      filters.deliveryDate ?? "all",
      filters.dateFrom ?? "from-all",
      filters.dateTo ?? "to-all",
    ] as const,
};
