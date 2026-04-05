import type { ListCashTransactionsFilters } from "@shared/types";
import { useQuery } from "@tanstack/react-query";
import { listCashTransactions } from "@/api/cash-api";
import { operationalQueryOptions } from "@/lib/operational-query";
import { cashQueryKeys } from "../lib/cash-query-keys";

export function useCashTransactions(filters: ListCashTransactionsFilters = {}) {
  return useQuery({
    queryKey: cashQueryKeys.list(filters),
    queryFn: () => listCashTransactions(filters),
    ...operationalQueryOptions,
  });
}
