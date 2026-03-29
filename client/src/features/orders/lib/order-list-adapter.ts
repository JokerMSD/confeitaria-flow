import type {
  OrderListItem as ApiOrderListItem,
  OrderStatus as ApiOrderStatus,
  PaymentMethod as ApiPaymentMethod,
  PaymentStatus as ApiPaymentStatus,
} from "@shared/types";
import type {
  OrderListCardItem,
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

function buildItemSummary(itemCount: number) {
  if (itemCount <= 0) {
    return "Sem itens";
  }

  if (itemCount === 1) {
    return "1 item no pedido";
  }

  return `${itemCount} itens no pedido`;
}

export function adaptOrderListItemToCard(order: ApiOrderListItem): OrderListCardItem {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    phone: order.customerPhone ?? "",
    orderDate: order.orderDate,
    deliveryDate: order.deliveryDate,
    deliveryTime: order.deliveryTime ?? undefined,
    status: statusLabelMap[order.status],
    paymentMethod: paymentMethodLabelMap[order.paymentMethod],
    paymentStatus: paymentStatusLabelMap[order.paymentStatus],
    totalAmount: order.subtotalAmountCents / 100,
    paidAmount: order.paidAmountCents / 100,
    remainingAmount: order.remainingAmountCents / 100,
    itemCount: order.itemCount,
    itemSummary: buildItemSummary(order.itemCount),
    items: [],
  };
}

export function adaptOrderListToCards(orders: ApiOrderListItem[]) {
  return orders.map(adaptOrderListItemToCard);
}
