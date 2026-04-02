import type {
  DeliveryMode,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from "./order-item.types";

export interface OrderQueueLineItem {
  productName: string;
  quantity: number;
}

export interface OrderQueueItem {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string | null;
  orderDate: string;
  deliveryDate: string;
  deliveryTime: string | null;
  deliveryMode: DeliveryMode;
  deliveryAddress: string | null;
  deliveryDistrict: string | null;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  notes: string | null;
  subtotalAmountCents: number;
  paidAmountCents: number;
  remainingAmountCents: number;
  itemCount: number;
  items: OrderQueueLineItem[];
}
