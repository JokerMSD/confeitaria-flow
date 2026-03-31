import type {
  OrderQueueItem as ApiOrderQueueItem,
  OrderStatus as ApiOrderStatus,
  PaymentMethod as ApiPaymentMethod,
  PaymentStatus as ApiPaymentStatus,
} from "@shared/types";
import type {
  OrderQueueCardItem,
  UiOrderStatus,
  UiPaymentMethod,
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

const paymentMethodLabelMap: Record<ApiPaymentMethod, UiPaymentMethod> = {
  Pix: "Pix",
  Dinheiro: "Dinheiro",
  CartaoCredito: "Cartão de crédito",
  CartaoDebito: "Cartão de débito",
  Transferencia: "Transferência",
};

export function adaptOrderQueueItem(
  order: ApiOrderQueueItem,
): OrderQueueCardItem {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    customerPhone: order.customerPhone ?? undefined,
    orderDate: order.orderDate,
    deliveryDate: order.deliveryDate,
    deliveryTime: order.deliveryTime ?? undefined,
    status: statusLabelMap[order.status],
    paymentMethod: paymentMethodLabelMap[order.paymentMethod],
    paymentStatus: paymentStatusLabelMap[order.paymentStatus],
    notes: order.notes ?? "",
    totalAmount: order.subtotalAmountCents / 100,
    paidAmount: order.paidAmountCents / 100,
    remainingAmount: order.remainingAmountCents / 100,
    itemCount: order.itemCount,
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
