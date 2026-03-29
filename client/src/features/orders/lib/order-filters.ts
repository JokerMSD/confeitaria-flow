import type {
  ListOrdersFilters,
  OrderStatus,
  PaymentStatus,
} from "@shared/types";

export function normalizeOrderFilters(filters: ListOrdersFilters): ListOrdersFilters {
  return {
    search: filters.search?.trim() || undefined,
    status: filters.status,
    deliveryDate: filters.deliveryDate,
    paymentStatus: filters.paymentStatus,
  };
}

export function mapUiStatusToApi(status: string): OrderStatus | undefined {
  switch (status) {
    case "Novo":
      return "Novo";
    case "Confirmado":
      return "Confirmado";
    case "Em produção":
      return "EmProducao";
    case "Pronto":
      return "Pronto";
    case "Entregue":
      return "Entregue";
    case "Cancelado":
      return "Cancelado";
    default:
      return undefined;
  }
}

export function mapUiPaymentStatusToApi(status: string): PaymentStatus | undefined {
  switch (status) {
    case "Pago":
      return "Pago";
    case "Parcial":
      return "Parcial";
    case "Pendente":
      return "Pendente";
    default:
      return undefined;
  }
}
