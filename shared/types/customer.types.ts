export interface CustomerListItem {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  notes?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface CustomerDetail extends CustomerListItem {
  totalSpentCents: number;
  lastOrderDate: string | null;
  orderCount: number;
}

export interface CustomerOrdersResponse {
  orders: Array<{
    id: string;
    orderNumber: string;
    orderDate: string;
    subtotalAmountCents: number;
    paidAmountCents: number;
    remainingAmountCents: number;
    status: string;
  }>;
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
