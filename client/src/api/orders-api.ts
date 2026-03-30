import type {
  CreateOrderRequest,
  DeleteOrderResponse,
  ListOrdersFilters,
  ListOrdersResponse,
  OrderDetailResponse,
  OrdersLookupResponse,
  OrdersQueueResponse,
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

export function deleteOrder(id: string) {
  return httpClient<DeleteOrderResponse>(`/api/orders/${id}`, {
    method: "DELETE",
  });
}
