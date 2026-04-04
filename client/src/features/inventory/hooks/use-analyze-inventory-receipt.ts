import { useMutation } from "@tanstack/react-query";
import { analyzeInventoryReceipt } from "@/api/inventory-api";

export function useAnalyzeInventoryReceipt() {
  return useMutation({
    mutationFn: analyzeInventoryReceipt,
  });
}
