import type { UpdateCashTransactionRequest } from "@shared/types";
import { useMutation } from "@tanstack/react-query";
import { updateCashTransaction } from "@/api/cash-api";
import { queryClient } from "@/lib/queryClient";
import { cashQueryKeys } from "../lib/cash-query-keys";

export function useUpdateCashTransaction() {
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateCashTransactionRequest;
    }) => updateCashTransaction(id, payload),
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: cashQueryKeys.all,
        }),
        queryClient.invalidateQueries({
          queryKey: cashQueryKeys.detail(variables.id),
        }),
      ]);
    },
  });
}
