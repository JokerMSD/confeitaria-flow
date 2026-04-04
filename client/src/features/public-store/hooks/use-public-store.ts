import { useMutation, useQuery } from "@tanstack/react-query";
import {
  createPublicCheckout,
  getPublicProduct,
  getPublicProducts,
  getPublicStoreHome,
} from "@/api/public-store-api";
import { publicStoreQueryKeys } from "../lib/public-store-query-keys";

export function usePublicStoreHome() {
  return useQuery({
    queryKey: publicStoreQueryKeys.home(),
    queryFn: getPublicStoreHome,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
}

export function usePublicProducts() {
  return useQuery({
    queryKey: publicStoreQueryKeys.products(),
    queryFn: getPublicProducts,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
}

export function usePublicProduct(id: string) {
  return useQuery({
    queryKey: publicStoreQueryKeys.product(id),
    queryFn: () => getPublicProduct(id),
    enabled: Boolean(id),
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function usePublicCheckout() {
  return useMutation({
    mutationFn: createPublicCheckout,
  });
}
