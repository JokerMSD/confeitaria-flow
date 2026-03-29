import { useQuery } from "@tanstack/react-query";
import { getCashTransaction } from "@/api/cash-api";
import { cashQueryKeys } from "../lib/cash-query-keys";

export function useCashTransaction(id: string | undefined) {
  return useQuery({
    queryKey: cashQueryKeys.detail(id ?? "unknown"),
    queryFn: () => getCashTransaction(id!),
    enabled: Boolean(id),
  });
}
