import { useMutation } from "@tanstack/react-query";
import { logout } from "@/api/auth-api";
import { queryClient } from "@/lib/queryClient";
import { authQueryKeys } from "../lib/auth-query-keys";

export function useLogout() {
  return useMutation({
    mutationFn: logout,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: authQueryKeys.session(),
      });
    },
  });
}
