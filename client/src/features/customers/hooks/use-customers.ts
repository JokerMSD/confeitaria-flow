import { useQuery } from "@tanstack/react-query";
import { listCustomers } from "@/api/customers-api";
import { customerQueryKeys } from "../lib/customer-query-keys";

export function useCustomers() {
  return useQuery({
    queryKey: customerQueryKeys.list(),
    queryFn: () => listCustomers(),
  });
}
