import type { PaymentMethod } from "./order-item.types";

export type CashTransactionType = "Entrada" | "Saida";
export type CashTransactionSourceType = "PedidoRecebimento" | "CompraEstoque";

export interface CashSummary {
  soldAmountCents: number;
  receivedAmountCents: number;
  receivableAmountCents: number;
  expenseAmountCents: number;
}

export interface CashTransaction {
  id: string;
  type: CashTransactionType;
  category: string;
  description: string;
  amountCents: number;
  paymentMethod: PaymentMethod;
  transactionDate: string;
  orderId: string | null;
  sourceType: CashTransactionSourceType | null;
  sourceId: string | null;
  isSystemGenerated: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreateCashTransactionInput {
  type: CashTransactionType;
  category: string;
  description: string;
  amountCents: number;
  paymentMethod: PaymentMethod;
  transactionDate: string;
  orderId?: string | null;
}

export interface UpdateCashTransactionInput extends CreateCashTransactionInput {}

export interface ListCashTransactionsFilters {
  search?: string;
  type?: CashTransactionType;
  category?: string;
  paymentMethod?: PaymentMethod;
  dateFrom?: string;
  dateTo?: string;
}

export interface GetCashSummaryFilters {
  date?: string;
}
