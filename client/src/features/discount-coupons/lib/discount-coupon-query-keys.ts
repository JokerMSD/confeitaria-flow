export const discountCouponQueryKeys = {
  list: () => ["discount-coupons"] as const,
  detail: (id: string) => ["discount-coupons", id] as const,
};
