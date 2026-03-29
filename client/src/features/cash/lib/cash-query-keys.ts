import type { ListCashTransactionsFilters } from "@shared/types";

export const cashQueryKeys = {
  all: ["cash-transactions"] as const,
  list: (filters: ListCashTransactionsFilters = {}) =>
    ["cash-transactions", "list", filters] as const,
  detail: (id: string) => ["cash-transactions", "detail", id] as const,
};
