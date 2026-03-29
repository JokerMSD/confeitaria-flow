import { useQuery } from "@tanstack/react-query";
import { ApiError } from "@/api/http-client";
import { getAuthSession } from "@/api/auth-api";
import { authQueryKeys } from "../lib/auth-query-keys";

export function useAuthSession() {
  return useQuery({
    queryKey: authQueryKeys.session(),
    queryFn: async () => {
      try {
        return await getAuthSession();
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          return null;
        }

        throw error;
      }
    },
    retry: false,
    staleTime: 0,
  });
}
