import { useQuery } from "@tanstack/react-query";
import { getProductionForecast } from "@/api/production-api";
import { productionQueryKeys } from "../lib/production-query-keys";

export function useProductionForecast(deliveryDate?: string) {
  return useQuery({
    queryKey: productionQueryKeys.forecast(deliveryDate),
    queryFn: () => getProductionForecast(deliveryDate),
  });
}
