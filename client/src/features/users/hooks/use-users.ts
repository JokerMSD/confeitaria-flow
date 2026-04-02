import { useQuery } from "@tanstack/react-query";
import { listUsers } from "@/api/users-api";
import { usersQueryKeys } from "../lib/users-query-keys";

export function useUsers() {
  return useQuery({
    queryKey: usersQueryKeys.list(),
    queryFn: () => listUsers(),
  });
}
