import { useQuery } from "@tanstack/react-query";
import type { ListCustomersFilters } from "@shared/types";
import { listCustomers } from "@/api/customers-api";
import { operationalQueryOptions } from "@/lib/operational-query";
import { customerQueryKeys } from "../lib/customer-query-keys";

export function useCustomers(filters: ListCustomersFilters = {}) {
  return useQuery({
    queryKey: customerQueryKeys.list(
      `${filters.search ?? ""}:${filters.sort ?? "name-asc"}`,
    ),
    queryFn: () => listCustomers(filters),
    ...operationalQueryOptions,
  });
}
