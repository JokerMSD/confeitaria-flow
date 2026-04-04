import type {
  AppliedDiscountCoupon,
  CreateDiscountCouponInput,
  DiscountCouponItem,
  UpdateDiscountCouponInput,
} from "./discount-coupon.types";

export interface ListDiscountCouponsResponse {
  data: DiscountCouponItem[];
}

export interface DiscountCouponDetailResponse {
  data: DiscountCouponItem;
}

export interface CreateDiscountCouponRequest {
  data: CreateDiscountCouponInput;
}

export interface UpdateDiscountCouponRequest {
  data: UpdateDiscountCouponInput;
}

export interface PublicCheckoutPricingPreviewResponse {
  data: {
    itemsSubtotalAmountCents: number;
    deliveryFeeCents: number;
    discountAmountCents: number;
    subtotalAmountCents: number;
    appliedCoupon: AppliedDiscountCoupon | null;
  };
}
