import type { OrderStatus, PaymentStatus } from "./order-item.types";

export interface OrderLookupItem {
  id: string;
  orderNumber: string;
  customerName: string;
  deliveryDate: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
}
