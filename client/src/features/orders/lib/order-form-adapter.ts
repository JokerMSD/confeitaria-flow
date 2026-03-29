import type {
  CreateOrderRequest,
  OrderDetailResponse,
  UpdateOrderRequest,
} from "@shared/types";
import type {
  OrderFormItem,
  OrderFormState,
  UiOrderStatus,
  UiPaymentMethod,
} from "../types/order-ui";

const apiToUiStatusMap: Record<string, UiOrderStatus> = {
  Novo: "Novo",
  Confirmado: "Confirmado",
  EmProducao: "Em produção",
  Pronto: "Pronto",
  Entregue: "Entregue",
  Cancelado: "Cancelado",
};

const uiToApiStatusMap: Record<UiOrderStatus, string> = {
  Novo: "Novo",
  Confirmado: "Confirmado",
  "Em produção": "EmProducao",
  Pronto: "Pronto",
  Entregue: "Entregue",
  Cancelado: "Cancelado",
};

const apiToUiPaymentMethodMap: Record<string, UiPaymentMethod> = {
  Pix: "Pix",
  Dinheiro: "Dinheiro",
  CartaoCredito: "Cartão de crédito",
  CartaoDebito: "Cartão de débito",
  Transferencia: "Transferência",
};

const uiToApiPaymentMethodMap: Record<UiPaymentMethod, string> = {
  Pix: "Pix",
  Dinheiro: "Dinheiro",
  "Cartão de crédito": "CartaoCredito",
  "Cartão de débito": "CartaoDebito",
  Transferência: "Transferencia",
};

function centsToDecimalString(cents: number) {
  return (cents / 100).toString();
}

function decimalStringToCents(value: string) {
  const normalized = value.replace(",", ".").trim();

  if (!normalized) {
    return 0;
  }

  const amount = Number.parseFloat(normalized);
  if (!Number.isFinite(amount)) {
    return 0;
  }

  return Math.round(amount * 100);
}

function buildPreviewSubtotal(item: Pick<OrderFormItem, "quantity" | "unitPrice">) {
  return item.quantity * item.unitPrice;
}

export function createEmptyOrderFormState(): OrderFormState {
  return {
    customerName: "",
    phone: "",
    orderDate: new Date().toISOString().split("T")[0],
    deliveryDate: "",
    deliveryTime: "",
    status: "Novo",
    paymentMethod: "Pix",
    paidAmount: "0",
    notes: "",
    items: [],
  };
}

export function adaptOrderDetailToFormState(
  response: OrderDetailResponse,
): OrderFormState {
  return {
    customerName: response.data.customerName,
    phone: response.data.customerPhone ?? "",
    orderDate: response.data.orderDate,
    deliveryDate: response.data.deliveryDate,
    deliveryTime: response.data.deliveryTime ?? "",
    status: apiToUiStatusMap[response.data.status],
    paymentMethod: apiToUiPaymentMethodMap[response.data.paymentMethod],
    paidAmount: centsToDecimalString(response.data.paidAmountCents),
    notes: response.data.notes ?? "",
    items: response.data.items.map((item) => ({
      id: item.id,
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPriceCents / 100,
      subtotal: item.lineTotalCents / 100,
      position: item.position,
    })),
  };
}

function adaptFormItemsToPayload(items: OrderFormItem[]) {
  return items.map((item, index) => ({
    productName: item.productName.trim(),
    quantity: item.quantity,
    unitPriceCents: decimalStringToCents(item.unitPrice.toString()),
    position: item.position ?? index,
  }));
}

export function adaptFormStateToCreatePayload(
  state: OrderFormState,
): CreateOrderRequest {
  return {
    data: {
      customerName: state.customerName.trim(),
      customerPhone: state.phone.trim() || null,
      orderDate: state.orderDate,
      deliveryDate: state.deliveryDate,
      deliveryTime: state.deliveryTime.trim() || null,
      status: uiToApiStatusMap[state.status] as CreateOrderRequest["data"]["status"],
      paymentMethod: uiToApiPaymentMethodMap[
        state.paymentMethod
      ] as CreateOrderRequest["data"]["paymentMethod"],
      paidAmountCents: decimalStringToCents(state.paidAmount),
      notes: state.notes.trim() || null,
      items: adaptFormItemsToPayload(state.items),
    },
  };
}

export function adaptFormStateToUpdatePayload(
  state: OrderFormState,
): UpdateOrderRequest {
  return {
    data: adaptFormStateToCreatePayload(state).data,
  };
}

export function buildOrderFormItem(
  id: string,
  productName: string,
  quantity: number,
  unitPrice: number,
  position: number,
): OrderFormItem {
  return {
    id,
    productName,
    quantity,
    unitPrice,
    subtotal: buildPreviewSubtotal({ quantity, unitPrice }),
    position,
  };
}
