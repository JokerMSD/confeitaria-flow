import { useMutation, useQuery } from "@tanstack/react-query";
import {
  createPublicCheckout,
  getPublicStoreAvailability,
  getPublicProduct,
  getPublicProducts,
  getPublicStorePaymentConfig,
  getPublicStoreHome,
  previewPublicCheckout,
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

export function usePublicStorePaymentConfig() {
  return useQuery({
    queryKey: publicStoreQueryKeys.paymentConfig(),
    queryFn: getPublicStorePaymentConfig,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
}

export function usePublicStoreAvailability(input: {
  deliveryMode: "Entrega" | "Retirada";
  selectedDate?: string;
}) {
  return useQuery({
    queryKey: publicStoreQueryKeys.availability(
      input.deliveryMode,
      input.selectedDate,
    ),
    queryFn: () => getPublicStoreAvailability(input),
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
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

export function usePublicCheckoutPreview() {
  return useMutation({
    mutationFn: previewPublicCheckout,
  });
}
