import { useMutation } from "@tanstack/react-query";
import { createCashTransaction } from "@/api/cash-api";
import { invalidateOperationalData } from "@/lib/operational-query";

export function useCreateCashTransaction() {
  return useMutation({
    mutationFn: createCashTransaction,
    onSuccess: async (response) => {
      await invalidateOperationalData({
        cashTransactionId: response.data.id,
      });
    },
  });
}
