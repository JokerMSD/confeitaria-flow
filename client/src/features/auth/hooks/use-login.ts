import { useMutation } from "@tanstack/react-query";
import { login } from "@/api/auth-api";
import { queryClient } from "@/lib/queryClient";
import { authQueryKeys } from "../lib/auth-query-keys";

export function useLogin() {
  return useMutation({
    mutationFn: login,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: authQueryKeys.session(),
      });
    },
  });
}
