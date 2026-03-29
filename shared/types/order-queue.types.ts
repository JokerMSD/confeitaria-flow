import type { OrderStatus, PaymentStatus } from "./order-item.types";

export interface OrderQueueLineItem {
  productName: string;
  quantity: number;
}

export interface OrderQueueItem {
  id: string;
  orderNumber: string;
  customerName: string;
  orderDate: string;
  deliveryDate: string;
  deliveryTime: string | null;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  items: OrderQueueLineItem[];
}
