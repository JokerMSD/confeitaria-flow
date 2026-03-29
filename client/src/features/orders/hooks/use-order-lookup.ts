import { useMemo } from "react";
import { useOrdersLookup } from "./use-orders-lookup";
import { adaptOrdersLookup } from "../lib/order-lookup-adapter";

export function useOrderLookup() {
  const query = useOrdersLookup();

  const options = useMemo(
    () => adaptOrdersLookup(query.data?.data ?? []),
    [query.data],
  );

  return {
    ...query,
    options,
  };
}
