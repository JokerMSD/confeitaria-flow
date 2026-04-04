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

function getPaymentMethod(order: ApiOrderQueueItem): UiPaymentMethod {
  if (order.paymentMethod) {
    return paymentMethodLabelMap[order.paymentMethod];
  }

  return "Pix";
}

export function adaptOrderQueueItem(
  order: ApiOrderQueueItem,
): OrderQueueCardItem {
  const totalAmountCents = order.subtotalAmountCents ?? 0;
  const paidAmountCents = order.paidAmountCents ?? 0;
  const remainingAmountCents =
    order.remainingAmountCents ?? Math.max(totalAmountCents - paidAmountCents, 0);

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    customerPhone: order.customerPhone ?? undefined,
    orderDate: order.orderDate,
    deliveryDate: order.deliveryDate,
    deliveryTime: order.deliveryTime ?? undefined,
    deliveryMode: order.deliveryMode,
    deliveryAddress: order.deliveryAddress ?? undefined,
    deliveryReference: order.deliveryReference ?? undefined,
    deliveryDistrict: order.deliveryDistrict ?? undefined,
    deliveryFee: (order.deliveryFeeCents ?? 0) / 100,
    status: statusLabelMap[order.status],
    paymentMethod: getPaymentMethod(order),
    paymentStatus: paymentStatusLabelMap[order.paymentStatus],
    notes: order.notes ?? "",
    totalAmount: totalAmountCents / 100,
    paidAmount: paidAmountCents / 100,
    remainingAmount: remainingAmountCents / 100,
    itemCount: order.itemCount ?? order.items.length,
    updatedAt: order.updatedAt,
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
