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
  });
}

export function usePublicProducts() {
  return useQuery({
    queryKey: publicStoreQueryKeys.products(),
    queryFn: getPublicProducts,
  });
}

export function usePublicProduct(id: string) {
  return useQuery({
    queryKey: publicStoreQueryKeys.product(id),
    queryFn: () => getPublicProduct(id),
    enabled: Boolean(id),
  });
}

export function usePublicCheckout() {
  return useMutation({
    mutationFn: createPublicCheckout,
  });
}
