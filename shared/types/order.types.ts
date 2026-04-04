import type {
  CreateOrderItemInput,
  DeliveryMode,
  OrderItem,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from "./order-item.types";

export interface OrderListItem {
  id: string;
  orderNumber: string;
  customerId?: string | null;
  customerName: string;
  customerPhone: string | null;
  orderDate: string;
  deliveryDate: string;
  deliveryTime: string | null;
  deliveryMode: DeliveryMode;
  deliveryAddress: string | null;
  deliveryReference: string | null;
  deliveryDistrict: string | null;
  deliveryFeeCents: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  notes: string | null;
  subtotalAmountCents: number;
  paidAmountCents: number;
  remainingAmountCents: number;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface OrderDetail extends OrderListItem {
  items: OrderItem[];
}

export interface CreateOrderInput {
  customerName: string;
  customerId?: string | null;
  customerPhone?: string | null;
  orderDate: string;
  deliveryDate: string;
  deliveryTime?: string | null;
  deliveryMode: DeliveryMode;
  deliveryAddress?: string | null;
  deliveryReference?: string | null;
  deliveryDistrict?: string | null;
  deliveryFeeCents?: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paidAmountCents: number;
  notes?: string | null;
  items: CreateOrderItemInput[];
}

export interface UpdateOrderInput extends CreateOrderInput {
  lastKnownUpdatedAt?: string | null;
}

export interface UpdateOrderStatusInput {
  status: OrderStatus;
  lastKnownUpdatedAt?: string | null;
}

export interface ListOrdersFilters {
  search?: string;
  status?: OrderStatus;
  deliveryDate?: string;
  paymentStatus?: PaymentStatus;
}
