import { useQuery } from "@tanstack/react-query";
import { getOrdersLookup } from "@/api/orders-api";
import { orderQueryKeys } from "../lib/order-query-keys";

export function useOrdersLookup() {
  return useQuery({
    queryKey: orderQueryKeys.lookup(),
    queryFn: () => getOrdersLookup(),
  });
}
