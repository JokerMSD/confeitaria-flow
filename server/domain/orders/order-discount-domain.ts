import type {
  DiscountCouponItem,
  OrderDiscount,
  OrderDiscountType,
} from "@shared/types";
import { HttpError } from "../../utils/http-error";

export function calculateDiscountAmountCents(input: {
  type: OrderDiscountType;
  value: number;
  grossAmountCents: number;
}) {
  if (input.grossAmountCents <= 0) {
    return 0;
  }

  if (input.type === "Percentual") {
    const normalizedPercent = Math.min(100, Math.max(0, input.value));
    return Math.min(
      input.grossAmountCents,
      Math.round((input.grossAmountCents * normalizedPercent) / 100),
    );
  }

  return Math.min(input.grossAmountCents, Math.max(0, input.value));
}

export function buildManualOrderDiscount(input: {
  type: OrderDiscountType;
  value: number;
  grossAmountCents: number;
  label?: string | null;
}): OrderDiscount | null {
  const amountCents = calculateDiscountAmountCents({
    type: input.type,
    value: input.value,
    grossAmountCents: input.grossAmountCents,
  });

  if (amountCents <= 0) {
    return null;
  }

  return {
    source: "Manual",
    type: input.type,
    value: input.value,
    amountCents,
    label: input.label?.trim() || null,
    couponCode: null,
  };
}

export function buildCouponOrderDiscount(input: {
  coupon: DiscountCouponItem;
  grossAmountCents: number;
}): OrderDiscount {
  if (!input.coupon.isActive) {
    throw new HttpError(400, "Este cupom nao esta ativo.");
  }

  if (input.coupon.minimumOrderAmountCents > input.grossAmountCents) {
    throw new HttpError(
      400,
      "Este cupom exige um valor minimo maior para ser aplicado.",
    );
  }

  const amountCents = calculateDiscountAmountCents({
    type: input.coupon.discountType,
    value: input.coupon.discountValue,
    grossAmountCents: input.grossAmountCents,
  });

  if (amountCents <= 0) {
    throw new HttpError(400, "Este cupom nao gera desconto para esse pedido.");
  }

  return {
    source: "Cupom",
    type: input.coupon.discountType,
    value: input.coupon.discountValue,
    amountCents,
    label: input.coupon.title,
    couponCode: input.coupon.code,
  };
}
