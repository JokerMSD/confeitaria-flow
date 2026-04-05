import { useMutation } from "@tanstack/react-query";
import { confirmInventoryReceiptImport } from "@/api/inventory-api";
import { invalidateOperationalData } from "@/lib/operational-query";

export function useConfirmInventoryReceiptImport() {
  return useMutation({
    mutationFn: confirmInventoryReceiptImport,
    onSuccess: async () => {
      await invalidateOperationalData();
    },
  });
}
