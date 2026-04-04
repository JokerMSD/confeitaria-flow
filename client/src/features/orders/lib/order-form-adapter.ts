import type {
  CreateOrderRequest,
  OrderDetailResponse,
  UpdateOrderRequest,
} from "@shared/types";
import {
  formatMoneyInput,
  parseMoneyInputToCents,
} from "@/features/inventory/lib/inventory-input-helpers";
import { getTodayLocalDateKey } from "@/lib/utils";
import { getOrderItemAdditionalsUnitTotal } from "./order-additionals";
import type {
  OrderFormItem,
  OrderFormItemAdditional,
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
  return formatMoneyInput(String(cents));
}

function decimalStringToCents(value: string) {
  return parseMoneyInputToCents(value) ?? 0;
}

function decimalNumberToCents(value: number) {
  return Math.round(value * 100);
}

function buildPreviewSubtotal(
  item: Pick<OrderFormItem, "quantity" | "unitPrice" | "additionals">,
) {
  return (
    item.quantity *
    (item.unitPrice + getOrderItemAdditionalsUnitTotal(item.additionals ?? []))
  );
}

function mapApiAdditionalToFormItem(
  additional: OrderDetailResponse["data"]["items"][number]["additionals"][number],
): OrderFormItemAdditional {
  return {
    groupId: additional.groupId,
    optionId: additional.optionId,
    groupName: additional.groupName,
    optionName: additional.optionName,
    priceDelta: additional.priceDeltaCents / 100,
    position: additional.position,
  };
}

export function createEmptyOrderFormState(): OrderFormState {
  return {
    lastKnownUpdatedAt: null,
    customerId: null,
    customerName: "",
    phone: "",
    orderDate: getTodayLocalDateKey(),
    deliveryDate: "",
    deliveryTime: "",
    deliveryMode: "Entrega",
    deliveryAddress: "",
    deliveryReference: "",
    deliveryDistrict: "",
    deliveryFee: "0",
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
    lastKnownUpdatedAt: response.data.updatedAt,
    customerId: response.data.customerId ?? null,
    customerName: response.data.customerName,
    phone: response.data.customerPhone ?? "",
    orderDate: response.data.orderDate,
    deliveryDate: response.data.deliveryDate,
    deliveryTime: response.data.deliveryTime ?? "",
    deliveryMode: response.data.deliveryMode,
    deliveryAddress: response.data.deliveryAddress ?? "",
    deliveryReference: response.data.deliveryReference ?? "",
    deliveryDistrict: response.data.deliveryDistrict ?? "",
    deliveryFee: centsToDecimalString(response.data.deliveryFeeCents ?? 0),
    status: apiToUiStatusMap[response.data.status],
    paymentMethod: apiToUiPaymentMethodMap[response.data.paymentMethod],
    paidAmount: centsToDecimalString(response.data.paidAmountCents),
    notes: response.data.notes ?? "",
    items: response.data.items.map((item) => {
      const additionals =
        item.additionals
          ?.slice()
          .sort((a, b) => a.position - b.position)
          .map(mapApiAdditionalToFormItem) ?? [];

      return {
        id: item.id,
        recipeId: item.recipeId ?? null,
        fillingRecipeId: item.fillingRecipeId ?? null,
        secondaryFillingRecipeId: item.secondaryFillingRecipeId ?? null,
        tertiaryFillingRecipeId: item.tertiaryFillingRecipeId ?? null,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPriceCents / 100,
        subtotal: buildPreviewSubtotal({
          quantity: item.quantity,
          unitPrice: item.unitPriceCents / 100,
          additionals,
        }),
        position: item.position,
        additionals,
      };
    }),
  };
}

function adaptFormItemsToPayload(items: OrderFormItem[]) {
  return items.map((item, index) => ({
    recipeId: item.recipeId ?? null,
    fillingRecipeId: item.fillingRecipeId ?? null,
    secondaryFillingRecipeId: item.secondaryFillingRecipeId ?? null,
    tertiaryFillingRecipeId: item.tertiaryFillingRecipeId ?? null,
    productName: item.productName.trim(),
    quantity: item.quantity,
    unitPriceCents: decimalNumberToCents(item.unitPrice),
    position: item.position ?? index,
    additionals: (item.additionals ?? [])
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((additional, additionalIndex) => ({
        groupId: additional.groupId,
        optionId: additional.optionId,
        position: additional.position ?? additionalIndex,
      })),
  }));
}

export function adaptFormStateToCreatePayload(
  state: OrderFormState,
): CreateOrderRequest {
  return {
    data: {
      customerId: state.customerId,
      customerName: state.customerName.trim(),
      customerPhone: state.phone.trim() || null,
      orderDate: state.orderDate,
      deliveryDate: state.deliveryDate,
      deliveryTime: state.deliveryTime.trim() || null,
      deliveryMode: state.deliveryMode,
      deliveryAddress:
        state.deliveryMode === "Entrega"
          ? state.deliveryAddress.trim() || null
          : null,
      deliveryReference:
        state.deliveryMode === "Entrega"
          ? state.deliveryReference.trim() || null
          : null,
      deliveryDistrict:
        state.deliveryMode === "Entrega"
          ? state.deliveryDistrict.trim() || null
          : null,
      deliveryFeeCents:
        state.deliveryMode === "Entrega"
          ? decimalStringToCents(state.deliveryFee)
          : 0,
      status: uiToApiStatusMap[
        state.status
      ] as CreateOrderRequest["data"]["status"],
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
    data: {
      ...adaptFormStateToCreatePayload(state).data,
      lastKnownUpdatedAt: state.lastKnownUpdatedAt,
    },
  };
}

export function buildOrderFormItem(
  id: string,
  recipeId: string | null,
  fillingRecipeId: string | null,
  secondaryFillingRecipeId: string | null,
  tertiaryFillingRecipeId: string | null,
  productName: string,
  quantity: number,
  unitPrice: number,
  position: number,
  additionals: OrderFormItemAdditional[] = [],
): OrderFormItem {
  return {
    id,
    recipeId,
    fillingRecipeId,
    secondaryFillingRecipeId,
    tertiaryFillingRecipeId,
    productName,
    quantity,
    unitPrice,
    subtotal: buildPreviewSubtotal({ quantity, unitPrice, additionals }),
    position,
    additionals,
  };
}
