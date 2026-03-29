import type {
  OrderQueueItem as ApiOrderQueueItem,
  OrderStatus as ApiOrderStatus,
  PaymentStatus as ApiPaymentStatus,
} from "@shared/types";
import type {
  OrderQueueCardItem,
  UiOrderStatus,
  UiPaymentStatus,
} from "../types/order-ui";

const statusLabelMap: Record<ApiOrderStatus, UiOrderStatus> = {
  Novo: "Novo",
  Confirmado: "Confirmado",
  EmProducao: "Em produção",
  Pronto: "Pronto",
  Entregue: "Entregue",
  Cancelado: "Cancelado",
};

const paymentStatusLabelMap: Record<ApiPaymentStatus, UiPaymentStatus> = {
  Pendente: "Pendente",
  Parcial: "Parcial",
  Pago: "Pago",
};

export function adaptOrderQueueItem(
  order: ApiOrderQueueItem,
): OrderQueueCardItem {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    orderDate: order.orderDate,
    deliveryDate: order.deliveryDate,
    deliveryTime: order.deliveryTime ?? undefined,
    status: statusLabelMap[order.status],
    paymentStatus: paymentStatusLabelMap[order.paymentStatus],
    items: order.items.map((item) => ({
      productName: item.productName,
      quantity: item.quantity,
    })),
  };
}

export function adaptOrdersQueue(
  orders: ApiOrderQueueItem[],
): OrderQueueCardItem[] {
  return orders.map(adaptOrderQueueItem);
}
