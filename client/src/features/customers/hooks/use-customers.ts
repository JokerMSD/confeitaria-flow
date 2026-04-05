import { useQuery } from "@tanstack/react-query";
import { listCustomers } from "@/api/customers-api";
import { operationalQueryOptions } from "@/lib/operational-query";
import { customerQueryKeys } from "../lib/customer-query-keys";

export function useCustomers(search?: string) {
  return useQuery({
    queryKey: customerQueryKeys.list(search),
    queryFn: () => listCustomers(search),
    ...operationalQueryOptions,
  });
}
