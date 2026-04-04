import { useQuery } from "@tanstack/react-query";
import { getDiscountCoupon } from "@/api/discount-coupons-api";
import { discountCouponQueryKeys } from "../lib/discount-coupon-query-keys";

export function useDiscountCoupon(id: string) {
  return useQuery({
    queryKey: discountCouponQueryKeys.detail(id),
    queryFn: () => getDiscountCoupon(id),
    enabled: Boolean(id),
  });
}
