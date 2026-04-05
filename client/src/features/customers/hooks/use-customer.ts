import { useQuery } from "@tanstack/react-query";
import { getCustomer } from "@/api/customers-api";
import { operationalQueryOptions } from "@/lib/operational-query";
import { customerQueryKeys } from "../lib/customer-query-keys";

export function useCustomer(id: string) {
  return useQuery({
    queryKey: customerQueryKeys.detail(id),
    queryFn: () => getCustomer(id),
    enabled: !!id,
    ...operationalQueryOptions,
  });
}
