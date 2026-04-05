import type {
  CreateOrderRequest,
  DeleteOrderResponse,
  ListOrdersFilters,
  ListOrdersResponse,
  OrderDetailResponse,
  OrdersDashboardSummaryFilters,
  OrdersDashboardSummaryResponse,
  OrdersLookupResponse,
  OrdersQueueResponse,
  UpdateOrderStatusRequest,
  UpdateOrderRequest,
} from "@shared/types";
import { httpClient } from "./http-client";

function buildOrdersQuery(filters: ListOrdersFilters = {}) {
  const params = new URLSearchParams();

  if (filters.search) params.set("search", filters.search);
  if (filters.status) params.set("status", filters.status);
  if (filters.deliveryDate) params.set("deliveryDate", filters.deliveryDate);
  if (filters.paymentStatus) params.set("paymentStatus", filters.paymentStatus);

  const query = params.toString();
  return query ? `/api/orders?${query}` : "/api/orders";
}

function buildOrdersDashboardSummaryQuery(
  filters: OrdersDashboardSummaryFilters = {},
) {
  const params = new URLSearchParams();

  if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
  if (filters.dateTo) params.set("dateTo", filters.dateTo);

  const query = params.toString();
  return query
    ? `/api/orders/dashboard-summary?${query}`
    : "/api/orders/dashboard-summary";
}

export function listOrders(filters: ListOrdersFilters = {}) {
  return httpClient<ListOrdersResponse>(buildOrdersQuery(filters));
}

export function getOrder(id: string) {
  return httpClient<OrderDetailResponse>(`/api/orders/${id}`);
}

export function getOrdersQueue() {
  return httpClient<OrdersQueueResponse>("/api/orders/queue");
}

export function getOrdersLookup() {
  return httpClient<OrdersLookupResponse>("/api/orders/lookup");
}

export function getOrdersDashboardSummary(
  filters: OrdersDashboardSummaryFilters = {},
) {
  return httpClient<OrdersDashboardSummaryResponse>(
    buildOrdersDashboardSummaryQuery(filters),
  );
}

export function createOrder(payload: CreateOrderRequest) {
  return httpClient<OrderDetailResponse>("/api/orders", {
    method: "POST",
    body: payload,
  });
}

export function updateOrder(id: string, payload: UpdateOrderRequest) {
  return httpClient<OrderDetailResponse>(`/api/orders/${id}`, {
    method: "PUT",
    body: payload,
  });
}

export function confirmOrder(id: string) {
  return httpClient<OrderDetailResponse>(`/api/orders/${id}/confirm`, {
    method: "POST",
  });
}

export function updateOrderStatus(id: string, payload: UpdateOrderStatusRequest) {
  return httpClient<OrderDetailResponse>(`/api/orders/${id}/status`, {
    method: "POST",
    body: payload,
  });
}

export function deleteOrder(id: string) {
  return httpClient<DeleteOrderResponse>(`/api/orders/${id}`, {
    method: "DELETE",
  });
}
