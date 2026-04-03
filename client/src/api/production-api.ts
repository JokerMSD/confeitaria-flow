import type { ProductionForecastResponse } from "@shared/types";
import { httpClient } from "./http-client";

export function getProductionForecast(deliveryDate?: string) {
  const query = deliveryDate
    ? `?${new URLSearchParams({ deliveryDate }).toString()}`
    : "";

  return httpClient<ProductionForecastResponse>(`/api/production/forecast${query}`);
}
