import { useMutation } from "@tanstack/react-query";
import { deleteCashTransaction } from "@/api/cash-api";
import { queryClient } from "@/lib/queryClient";
import { cashQueryKeys } from "../lib/cash-query-keys";

export function useDeleteCashTransaction() {
  return useMutation({
    mutationFn: deleteCashTransaction,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: cashQueryKeys.all,
      });
    },
  });
}
