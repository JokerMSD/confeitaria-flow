export interface CustomerListItem {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  notes?: string | null;
  isActive: boolean;
  totalSpentCents: number;
  lastOrderDate: string | null;
  orderCount: number;
  openOrderCount: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface CustomerDetail extends CustomerListItem {
  orders: Array<{
    id: string;
    orderNumber: string;
    orderDate: string;
    deliveryDate: string;
    deliveryTime?: string | null;
    deliveryMode: "Entrega" | "Retirada";
    deliveryAddress?: string | null;
    deliveryDistrict?: string | null;
    status: string;
    subtotalAmountCents: number;
    paidAmountCents: number;
    remainingAmountCents: number;
  }>;
}

export interface ListCustomersFilters {
  search?: string;
  sort?:
    | "name-asc"
    | "name-desc"
    | "spent-desc"
    | "spent-asc"
    | "last-order-desc"
    | "last-order-asc";
}

export interface CreateCustomerInput {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  notes?: string;
}

export interface UpdateCustomerInput extends CreateCustomerInput {
  isActive?: boolean;
}
