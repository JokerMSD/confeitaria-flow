import type { OrderDetail, OrderListItem } from "@shared/types";
import type { Order, OrderItem } from "../types/order-ui";

export function mapOrderListItemToOrder(order: OrderListItem): Order {
  return {
    ...order,
    items: [],
  };
}

export function mapOrderDetailToOrder(order: OrderDetail): Order {
  return {
    ...order,
    items: order.items.map<OrderItem>((item) => ({
      ...item,
    })),
  };
}
