import type {
  PublicCheckoutRequest,
  PublicCheckoutPricingPreviewRequest,
  PublicCheckoutPricingPreviewResponse,
  PublicCheckoutResponse,
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
