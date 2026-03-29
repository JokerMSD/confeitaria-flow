import type {
  CashSummary,
  CashTransaction,
  CreateCashTransactionInput,
  GetCashSummaryFilters,
  ListCashTransactionsFilters,
  UpdateCashTransactionInput,
} from "./cash.types";

export interface ListCashTransactionsResponse {
  data: CashTransaction[];
  filters: ListCashTransactionsFilters;
}

export interface CashTransactionDetailResponse {
  data: CashTransaction;
}

export interface CreateCashTransactionRequest {
  data: CreateCashTransactionInput;
}

export interface UpdateCashTransactionRequest {
  data: UpdateCashTransactionInput;
}

export interface DeleteCashTransactionResponse {
  data: {
    id: string;
    deletedAt: string;
  };
}

export interface CashSummaryResponse {
  data: CashSummary;
  filters: GetCashSummaryFilters;
}
