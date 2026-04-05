import { useMutation } from "@tanstack/react-query";
import { deleteCustomer } from "@/api/customers-api";
import { invalidateOperationalData } from "@/lib/operational-query";

export function useDeleteCustomer() {
  return useMutation({
    mutationFn: (id: string) => deleteCustomer(id),
    onSuccess: async () => {
      await invalidateOperationalData();
    },
  });
}
