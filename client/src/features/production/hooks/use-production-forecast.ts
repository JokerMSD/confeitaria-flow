import { useQuery } from "@tanstack/react-query";
import { getProductionForecast } from "@/api/production-api";
import { productionQueryKeys } from "../lib/production-query-keys";

export function useProductionForecast(filters: {
  deliveryDate?: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  return useQuery({
    queryKey: productionQueryKeys.forecast(filters),
    queryFn: () => getProductionForecast(filters),
  });
}
