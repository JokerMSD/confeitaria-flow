import type { OrderDetail, OrderItem as SharedOrderItem } from "@shared/types";

export interface OrderItem extends SharedOrderItem {}

export interface Order extends Omit<OrderDetail, "items"> {
  items: OrderItem[];
}
