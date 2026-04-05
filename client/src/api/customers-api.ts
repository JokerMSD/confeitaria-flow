import type {
  CustomerDetail,
  CustomerListItem,
  CreateCustomerInput,
  ListCustomersFilters,
  UpdateCustomerInput,
} from "@shared/types";
import { httpClient } from "./http-client";

export function listCustomers(filters: ListCustomersFilters = {}) {
  const params = new URLSearchParams();
  if (filters.search) {
    params.set("search", filters.search);
  }
  if (filters.sort) {
    params.set("sort", filters.sort);
  }
  const query = params.size > 0 ? `?${params.toString()}` : "";

  return httpClient<{ data: CustomerListItem[] }>(`/api/customers${query}`);
}

export function getCustomer(id: string) {
  return httpClient<{ data: CustomerDetail }>(`/api/customers/${id}`);
}

export function createCustomer(data: CreateCustomerInput) {
  return httpClient<{ data: CustomerDetail }>("/api/customers", {
    method: "POST",
    body: { data },
  });
}

export function updateCustomer(id: string, data: UpdateCustomerInput) {
  return httpClient<{ data: CustomerDetail }>(`/api/customers/${id}`, {
    method: "PUT",
    body: { data },
  });
}

export function deactivateCustomer(id: string) {
  return httpClient<{ data: CustomerDetail }>(
    `/api/customers/${id}/deactivate`,
    {
      method: "POST",
      body: {},
    },
  );
}

export function deleteCustomer(id: string) {
  return httpClient<void>(`/api/customers/${id}`, { method: "DELETE" });
}
