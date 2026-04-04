import type {
  CreateOrderItemInput,
  DeliveryMode,
  OrderItem,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from "./order-item.types";
import type { DiscountCouponType } from "./discount-coupon.types";

export type OrderDiscountSource = "Manual" | "Cupom";
export type OrderDiscountType = DiscountCouponType;

export interface OrderDiscount {
  source: OrderDiscountSource;
  type: OrderDiscountType;
  value: number;
  amountCents: number;
  label: string | null;
  couponCode: string | null;
}

export interface OrderListItem {
  id: string;
  orderNumber: string;
  customerId?: string | null;
  customerName: string;
  customerPhone: string | null;
  orderDate: string;
  deliveryDate: string;
  deliveryTime: string | null;
  deliveryMode: DeliveryMode;
  deliveryAddress: string | null;
  deliveryReference: string | null;
  deliveryDistrict: string | null;
  deliveryFeeCents: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentProvider: string | null;
  paymentProviderPaymentId: string | null;
  paymentProviderStatus: string | null;
  paymentProviderStatusDetail: string | null;
  notes: string | null;
  itemsSubtotalAmountCents: number;
  discountAmountCents: number;
  discount: OrderDiscount | null;
  subtotalAmountCents: number;
  paidAmountCents: number;
  remainingAmountCents: number;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface OrderDetail extends OrderListItem {
  items: OrderItem[];
}

export interface CreateOrderInput {
  customerName: string;
  customerId?: string | null;
  customerPhone?: string | null;
  orderDate: string;
  deliveryDate: string;
  deliveryTime?: string | null;
  deliveryMode: DeliveryMode;
  deliveryAddress?: string | null;
  deliveryReference?: string | null;
  deliveryDistrict?: string | null;
  deliveryFeeCents?: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paidAmountCents: number;
  paymentProvider?: string | null;
  paymentProviderPaymentId?: string | null;
  paymentProviderStatus?: string | null;
  paymentProviderStatusDetail?: string | null;
  discount?: {
    source?: OrderDiscountSource;
    type: OrderDiscountType;
    value: number;
    label?: string | null;
    couponCode?: string | null;
  } | null;
  notes?: string | null;
  items: CreateOrderItemInput[];
}

export interface UpdateOrderInput extends CreateOrderInput {
  lastKnownUpdatedAt?: string | null;
}

export interface UpdateOrderStatusInput {
  status: OrderStatus;
  lastKnownUpdatedAt?: string | null;
}

export interface ListOrdersFilters {
  search?: string;
  status?: OrderStatus;
  deliveryDate?: string;
  paymentStatus?: PaymentStatus;
}
