import type {
  PublicCheckoutRequest,
  PublicCheckoutPricingPreviewRequest,
  PublicCheckoutPricingPreviewResponse,
  PublicCheckoutResponse,
  PublicStoreAvailabilityResponse,
  PublicStorePaymentConfigResponse,
  PublicStoreHomeResponse,
  PublicStoreProductDetailResponse,
  PublicStoreProductsResponse,
} from "@shared/types";
import { httpClient } from "./http-client";

export function getPublicStoreHome() {
  return httpClient<PublicStoreHomeResponse>("/api/public/store");
}

export function getPublicStorePaymentConfig() {
  return httpClient<PublicStorePaymentConfigResponse>(
    "/api/public/store/payment-config",
  );
}

export function getPublicStoreAvailability(params: {
  deliveryMode: "Entrega" | "Retirada";
  selectedDate?: string;
}) {
  const searchParams = new URLSearchParams({
    deliveryMode: params.deliveryMode,
  });

  if (params.selectedDate) {
    searchParams.set("selectedDate", params.selectedDate);
  }

  return httpClient<PublicStoreAvailabilityResponse>(
    `/api/public/store/availability?${searchParams.toString()}`,
  );
}

export function getPublicProducts() {
  return httpClient<PublicStoreProductsResponse>("/api/public/store/products");
}

export function getPublicProduct(id: string) {
  return httpClient<PublicStoreProductDetailResponse>(
    `/api/public/store/products/${id}`,
  );
}

export function createPublicCheckout(body: PublicCheckoutRequest) {
  return httpClient<PublicCheckoutResponse>("/api/public/store/checkout", {
    method: "POST",
    body,
  });
}

export function previewPublicCheckout(body: PublicCheckoutPricingPreviewRequest) {
  return httpClient<PublicCheckoutPricingPreviewResponse>(
    "/api/public/store/checkout/preview",
    {
      method: "POST",
      body,
    },
  );
}
