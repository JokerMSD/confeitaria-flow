export type UiCashTransactionType = "Entrada" | "Saída";

export type UiCashPaymentMethod =
  | "Pix"
  | "Dinheiro"
  | "Cartão de crédito"
  | "Cartão de débito"
  | "Transferência";

export interface CashListItem {
  id: string;
  type: UiCashTransactionType;
  category: string;
  description: string;
  amount: number;
  paymentMethod: UiCashPaymentMethod;
  date: string;
  orderId: string | null;
  sourceType: "PedidoRecebimento" | "CompraEstoque" | null;
  sourceId: string | null;
  isSystemGenerated: boolean;
}

export interface CashFormState {
  type: UiCashTransactionType;
  category: string;
  description: string;
  amount: string;
  paymentMethod: UiCashPaymentMethod;
  date: string;
  orderId: string;
}
