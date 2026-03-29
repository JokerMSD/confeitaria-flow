import type {
  CashSummaryResponse,
  CashTransactionDetailResponse,
  CreateCashTransactionRequest,
  DeleteCashTransactionResponse,
  GetCashSummaryFilters,
  ListCashTransactionsFilters,
  ListCashTransactionsResponse,
  UpdateCashTransactionRequest,
} from "@shared/types";
import { httpClient } from "./http-client";

function buildCashTransactionsQuery(filters: ListCashTransactionsFilters = {}) {
  const params = new URLSearchParams();

  if (filters.search) params.set("search", filters.search);
  if (filters.type) params.set("type", filters.type);
  if (filters.category) params.set("category", filters.category);
  if (filters.paymentMethod) params.set("paymentMethod", filters.paymentMethod);
  if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
  if (filters.dateTo) params.set("dateTo", filters.dateTo);

  const query = params.toString();
  return query ? `/api/cash-transactions?${query}` : "/api/cash-transactions";
}

export function listCashTransactions(filters: ListCashTransactionsFilters = {}) {
  return httpClient<ListCashTransactionsResponse>(buildCashTransactionsQuery(filters));
}

export function getCashSummary(filters: GetCashSummaryFilters = {}) {
  const params = new URLSearchParams();

  if (filters.date) params.set("date", filters.date);

  const query = params.toString();
  const url = query ? `/api/cash-summary?${query}` : "/api/cash-summary";
  return httpClient<CashSummaryResponse>(url);
}

export function getCashTransaction(id: string) {
  return httpClient<CashTransactionDetailResponse>(`/api/cash-transactions/${id}`);
}

export function createCashTransaction(payload: CreateCashTransactionRequest) {
  return httpClient<CashTransactionDetailResponse>("/api/cash-transactions", {
    method: "POST",
    body: payload,
  });
}

export function updateCashTransaction(
  id: string,
  payload: UpdateCashTransactionRequest,
) {
  return httpClient<CashTransactionDetailResponse>(`/api/cash-transactions/${id}`, {
    method: "PUT",
    body: payload,
  });
}

export function deleteCashTransaction(id: string) {
  return httpClient<DeleteCashTransactionResponse>(`/api/cash-transactions/${id}`, {
    method: "DELETE",
  });
}
