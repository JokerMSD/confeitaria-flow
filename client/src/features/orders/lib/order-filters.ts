import type { ListOrdersFilters } from "@shared/types";

export function normalizeOrderFilters(filters: ListOrdersFilters): ListOrdersFilters {
  return {
    search: filters.search?.trim() || undefined,
    status: filters.status,
    deliveryDate: filters.deliveryDate,
    paymentStatus: filters.paymentStatus,
  };
}
