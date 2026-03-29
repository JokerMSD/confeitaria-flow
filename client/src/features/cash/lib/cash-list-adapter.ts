import type {
  CashTransaction as ApiCashTransaction,
  CashTransactionType as ApiCashTransactionType,
  PaymentMethod as ApiPaymentMethod,
} from "@shared/types";
import type {
  CashListItem,
  UiCashPaymentMethod,
  UiCashTransactionType,
} from "../types/cash-ui";

const typeLabelMap: Record<ApiCashTransactionType, UiCashTransactionType> = {
  Entrada: "Entrada",
  Saida: "Saída",
};

const paymentMethodLabelMap: Record<ApiPaymentMethod, UiCashPaymentMethod> = {
  Pix: "Pix",
  Dinheiro: "Dinheiro",
  CartaoCredito: "Cartão de crédito",
  CartaoDebito: "Cartão de débito",
  Transferencia: "Transferência",
};

export function adaptCashTransactionToListItem(
  transaction: ApiCashTransaction,
): CashListItem {
  return {
    id: transaction.id,
    type: typeLabelMap[transaction.type],
    category: transaction.category,
    description: transaction.description,
    amount: transaction.amountCents / 100,
    paymentMethod: paymentMethodLabelMap[transaction.paymentMethod],
    date: transaction.transactionDate,
    orderId: transaction.orderId,
    sourceType: transaction.sourceType,
    sourceId: transaction.sourceId,
    isSystemGenerated: transaction.isSystemGenerated,
  };
}

export function adaptCashTransactionsToList(
  transactions: ApiCashTransaction[],
) {
  return transactions.map(adaptCashTransactionToListItem);
}
