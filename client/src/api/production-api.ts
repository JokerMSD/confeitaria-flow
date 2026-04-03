import type { ProductionForecastResponse } from "@shared/types";
import { httpClient } from "./http-client";

export function getProductionForecast(filters: {
  deliveryDate?: string;
  dateFrom?: string;
  dateTo?: string;
} = {}) {
  const params = new URLSearchParams();

  if (filters.deliveryDate) {
    params.set("deliveryDate", filters.deliveryDate);
  }

  if (filters.dateFrom) {
    params.set("dateFrom", filters.dateFrom);
  }

  if (filters.dateTo) {
    params.set("dateTo", filters.dateTo);
  }

  const query = params.toString() ? `?${params.toString()}` : "";

  return httpClient<ProductionForecastResponse>(`/api/production/forecast${query}`);
}
