import type { UpdateCashTransactionRequest } from "@shared/types";
import { useMutation } from "@tanstack/react-query";
import { updateCashTransaction } from "@/api/cash-api";
import { invalidateOperationalData } from "@/lib/operational-query";

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
      await invalidateOperationalData({
        cashTransactionId: variables.id,
      });
    },
  });
}
