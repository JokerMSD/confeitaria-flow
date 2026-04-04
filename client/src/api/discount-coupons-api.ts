import type {
  CreateDiscountCouponRequest,
  DiscountCouponDetailResponse,
  ListDiscountCouponsResponse,
  UpdateDiscountCouponRequest,
} from "@shared/types";
import { httpClient } from "./http-client";

export function listDiscountCoupons() {
  return httpClient<ListDiscountCouponsResponse>("/api/discount-coupons");
}

export function getDiscountCoupon(id: string) {
  return httpClient<DiscountCouponDetailResponse>(`/api/discount-coupons/${id}`);
}

export function createDiscountCoupon(payload: CreateDiscountCouponRequest) {
  return httpClient<DiscountCouponDetailResponse>("/api/discount-coupons", {
    method: "POST",
    body: payload,
  });
}

export function updateDiscountCoupon(
  id: string,
  payload: UpdateDiscountCouponRequest,
) {
  return httpClient<DiscountCouponDetailResponse>(`/api/discount-coupons/${id}`, {
    method: "PUT",
    body: payload,
  });
}
