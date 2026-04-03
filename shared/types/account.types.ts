import type { UserRole } from "./users.types";

export interface AccountProfile {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  customerId?: string | null;
  photoUrl?: string | null;
  phone?: string | null;
  totalSpentCents: number;
  orderCount: number;
  openOrderCount: number;
  lastOrderDate: string | null;
}

export interface UpdateAccountProfileInput {
  fullName: string;
  email: string;
  phone?: string | null;
  photoUrl?: string | null;
}

export interface ChangeAccountPasswordInput {
  currentPassword: string;
  newPassword: string;
}

export interface AccountProfileResponse {
  data: AccountProfile;
}

export interface UpdateAccountProfileRequest {
  data: UpdateAccountProfileInput;
}

export interface ChangeAccountPasswordRequest {
  data: ChangeAccountPasswordInput;
}

export interface AccountOrdersResponse {
  data: Array<{
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
