export type DiscountCouponType = "Percentual" | "ValorFixo";

export interface DiscountCouponItem {
  id: string;
  code: string;
  title: string;
  description: string | null;
  discountType: DiscountCouponType;
  discountValue: number;
  minimumOrderAmountCents: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreateDiscountCouponInput {
  code: string;
  title: string;
  description?: string | null;
  discountType: DiscountCouponType;
  discountValue: number;
  minimumOrderAmountCents?: number;
  isActive?: boolean;
}

export interface UpdateDiscountCouponInput {
  code?: string;
  title?: string;
  description?: string | null;
  discountType?: DiscountCouponType;
  discountValue?: number;
  minimumOrderAmountCents?: number;
  isActive?: boolean;
}

export interface AppliedDiscountCoupon {
  id: string;
  code: string;
  title: string;
  discountType: DiscountCouponType;
  discountValue: number;
  discountAmountCents: number;
}
