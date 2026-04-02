import { useQuery } from "@tanstack/react-query";
import { getUser } from "@/api/users-api";
import { usersQueryKeys } from "../lib/users-query-keys";

export function useUser(id: string) {
  return useQuery({
    queryKey: usersQueryKeys.detail(id),
    queryFn: () => getUser(id),
    enabled: !!id,
  });
}
