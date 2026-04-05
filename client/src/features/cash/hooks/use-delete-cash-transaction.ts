import { useMutation } from "@tanstack/react-query";
import { deleteCashTransaction } from "@/api/cash-api";
import { invalidateOperationalData } from "@/lib/operational-query";

export function useDeleteCashTransaction() {
  return useMutation({
    mutationFn: deleteCashTransaction,
    onSuccess: async () => {
      await invalidateOperationalData();
    },
  });
}
