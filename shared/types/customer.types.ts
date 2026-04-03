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
    status: string;
    subtotalAmountCents: number;
    paidAmountCents: number;
    remainingAmountCents: number;
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
