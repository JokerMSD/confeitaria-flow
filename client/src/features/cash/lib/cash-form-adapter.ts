import type {
  CashTransactionDetailResponse,
  CreateCashTransactionRequest,
  UpdateCashTransactionRequest,
  CashTransactionType as ApiCashTransactionType,
  PaymentMethod as ApiPaymentMethod,
} from "@shared/types";
import type {
  CashFormState,
  UiCashPaymentMethod,
  UiCashTransactionType,
} from "../types/cash-ui";

const apiToUiTypeMap: Record<ApiCashTransactionType, UiCashTransactionType> = {
  Entrada: "Entrada",
  Saida: "Saída",
};

const uiToApiTypeMap: Record<UiCashTransactionType, ApiCashTransactionType> = {
  Entrada: "Entrada",
  "Saída": "Saida",
};

const apiToUiPaymentMethodMap: Record<ApiPaymentMethod, UiCashPaymentMethod> = {
  Pix: "Pix",
  Dinheiro: "Dinheiro",
  CartaoCredito: "Cartão de crédito",
  CartaoDebito: "Cartão de débito",
  Transferencia: "Transferência",
};

const uiToApiPaymentMethodMap: Record<UiCashPaymentMethod, ApiPaymentMethod> = {
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

function isoToDateTimeLocal(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function dateTimeLocalToIso(value: string) {
  return new Date(value).toISOString();
}

export function createEmptyCashFormState(
  defaultType: UiCashTransactionType = "Entrada",
): CashFormState {
  return {
    type: defaultType,
    category: defaultType === "Entrada" ? "Venda" : "Insumos",
    description: "",
    amount: "",
    paymentMethod: "Pix",
    date: new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16),
    orderId: "",
  };
}

export function adaptCashTransactionDetailToFormState(
  response: CashTransactionDetailResponse,
): CashFormState {
  return {
    type: apiToUiTypeMap[response.data.type],
    category: response.data.category,
    description: response.data.description,
    amount: centsToDecimalString(response.data.amountCents),
    paymentMethod: apiToUiPaymentMethodMap[response.data.paymentMethod],
    date: isoToDateTimeLocal(response.data.transactionDate),
    orderId: response.data.orderId ?? "",
  };
}

function adaptFormStateToInput(state: CashFormState) {
  return {
    type: uiToApiTypeMap[state.type],
    category: state.category.trim(),
    description: state.description.trim(),
    amountCents: decimalStringToCents(state.amount),
    paymentMethod: uiToApiPaymentMethodMap[state.paymentMethod],
    transactionDate: dateTimeLocalToIso(state.date),
    orderId: state.orderId || null,
  };
}

export function adaptCashFormStateToCreatePayload(
  state: CashFormState,
): CreateCashTransactionRequest {
  return {
    data: adaptFormStateToInput(state),
  };
}

export function adaptCashFormStateToUpdatePayload(
  state: CashFormState,
): UpdateCashTransactionRequest {
  return {
    data: adaptFormStateToInput(state),
  };
}
