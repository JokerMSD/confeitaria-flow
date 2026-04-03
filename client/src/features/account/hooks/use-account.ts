import { useMutation, useQuery } from "@tanstack/react-query";
import {
  changeAccountPassword,
  getAccountOrders,
  getAccountProfile,
  updateAccountProfile,
} from "@/api/account-api";
import { queryClient } from "@/lib/queryClient";
import { authQueryKeys } from "@/features/auth/lib/auth-query-keys";
import { accountQueryKeys } from "../lib/account-query-keys";

export function useAccountProfile(enabled = true) {
  return useQuery({
    queryKey: accountQueryKeys.profile(),
    queryFn: getAccountProfile,
    enabled,
  });
}

export function useAccountOrders(enabled = true) {
  return useQuery({
    queryKey: accountQueryKeys.orders(),
    queryFn: getAccountOrders,
    enabled,
  });
}

export function useUpdateAccountProfile() {
  return useMutation({
    mutationFn: updateAccountProfile,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: accountQueryKeys.profile() }),
        queryClient.invalidateQueries({ queryKey: accountQueryKeys.orders() }),
        queryClient.invalidateQueries({ queryKey: authQueryKeys.session() }),
      ]);
    },
  });
}

export function useChangeAccountPassword() {
  return useMutation({
    mutationFn: changeAccountPassword,
  });
}
