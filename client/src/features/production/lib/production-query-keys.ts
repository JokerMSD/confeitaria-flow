export const productionQueryKeys = {
  forecast: (deliveryDate?: string) =>
    ["production", "forecast", deliveryDate ?? "all"] as const,
};
