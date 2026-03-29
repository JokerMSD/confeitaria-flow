import { useMutation } from "@tanstack/react-query";
import { createCashTransaction } from "@/api/cash-api";
import { queryClient } from "@/lib/queryClient";
import { cashQueryKeys } from "../lib/cash-query-keys";

export function useCreateCashTransaction() {
  return useMutation({
    mutationFn: createCashTransaction,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: cashQueryKeys.all,
      });
    },
  });
}
