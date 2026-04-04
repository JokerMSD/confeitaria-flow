import { useQuery } from "@tanstack/react-query";
import { listDiscountCoupons } from "@/api/discount-coupons-api";
import { discountCouponQueryKeys } from "../lib/discount-coupon-query-keys";

export function useDiscountCoupons() {
  return useQuery({
    queryKey: discountCouponQueryKeys.list(),
    queryFn: listDiscountCoupons,
  });
}
