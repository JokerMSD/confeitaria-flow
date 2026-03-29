import type { OrderLookupItem as ApiOrderLookupItem } from "@shared/types";

export interface OrderLookupOption {
  id: string;
  orderNumber: string;
  customerName: string;
  label: string;
}

export function adaptOrderLookupItem(
  order: ApiOrderLookupItem,
): OrderLookupOption {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    label: `${order.orderNumber} - ${order.customerName}`,
  };
}

export function adaptOrdersLookup(orders: ApiOrderLookupItem[]) {
  return orders.map(adaptOrderLookupItem);
}
