import type { GetCashSummaryFilters } from "@shared/types";
import { useQuery } from "@tanstack/react-query";
import { getCashSummary } from "@/api/cash-api";
import { operationalQueryOptions } from "@/lib/operational-query";

export function useCashSummary(filters: GetCashSummaryFilters = {}) {
  return useQuery({
    queryKey: ["cash-summary", filters],
    queryFn: () => getCashSummary(filters),
    ...operationalQueryOptions,
  });
}
