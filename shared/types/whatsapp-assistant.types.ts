import type { DeliveryMode, OrderStatus, PaymentStatus } from "./order-item.types";

export interface WhatsAppAssistantCustomer {
  whatsappCustomerId: string | null;
  customerId: string | null;
  phone: string;
  name: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  isActive: boolean | null;
  source: "whatsapp" | "customer" | "linked";
  lastInteractionAt: string | null;
}

export interface WhatsAppAssistantCustomerUpsertInput {
  phone: string;
  name?: string;
  address?: string;
  notes?: string;
}

export interface WhatsAppAssistantCatalogItem {
  id: string;
  name: string;
  category: string;
  priceCents: number;
  available: boolean;
  notes: string | null;
  primaryImageUrl: string | null;
}

export interface WhatsAppAssistantDraftOrder {
  id: string;
  customerPhone: string;
  whatsappCustomerId: string | null;
  customerId: string | null;
  productId: string | null;
  productName: string | null;
  quantity: number | null;
  flavor: string | null;
  deliveryDate: string | null;
  deliveryType: "pickup" | "delivery" | null;
  address: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WhatsAppAssistantDraftUpsertInput {
  customerPhone: string;
  productId?: string;
  productName?: string;
  quantity?: number;
  flavor?: string;
  deliveryDate?: string;
  deliveryType?: "pickup" | "delivery";
  address?: string;
  notes?: string;
}

export interface WhatsAppAssistantDraftConfirmInput {
  customerPhone: string;
}

export interface WhatsAppAssistantOrderSummary {
  id: string;
  orderNumber: string;
  customerName: string;
  orderDate: string;
  deliveryDate: string;
  deliveryTime: string | null;
  deliveryMode: DeliveryMode;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  subtotalAmountCents: number;
  paidAmountCents: number;
  remainingAmountCents: number;
  itemSummary: string | null;
}

export interface WhatsAppAssistantSessionStatus {
  customerExists: boolean;
  hasDraftOrder: boolean;
  missingFields: string[];
  lastOrderId?: string;
}
