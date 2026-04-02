import type { OrderDetail, OrderItem as SharedOrderItem } from "@shared/types";

export interface OrderItem extends SharedOrderItem {}

export interface Order extends Omit<OrderDetail, "items"> {
  items: OrderItem[];
}

export type UiOrderStatus =
  | "Novo"
  | "Confirmado"
  | "Em produção"
  | "Pronto"
  | "Entregue"
  | "Cancelado";

export type UiPaymentStatus = "Pendente" | "Parcial" | "Pago";

export type UiPaymentMethod =
  | "Pix"
  | "Dinheiro"
  | "Cartão de crédito"
  | "Cartão de débito"
  | "Transferência";

export type UiDeliveryMode = "Entrega" | "Retirada";

export interface OrderListCardItem {
  id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  orderDate: string;
  deliveryDate: string;
  deliveryTime?: string;
  deliveryMode: UiDeliveryMode;
  deliveryAddress: string;
  deliveryReference: string;
  deliveryDistrict: string;
  deliveryFee: number;
  status: UiOrderStatus;
  paymentMethod: UiPaymentMethod;
  paymentStatus: UiPaymentStatus;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  itemCount: number;
  itemSummary: string;
  notes: string;
  items: Array<{ quantity: number; productName: string }>;
}

export interface OrderFormItem {
  id: string;
  recipeId: string | null;
  fillingRecipeId: string | null;
  secondaryFillingRecipeId: string | null;
  tertiaryFillingRecipeId: string | null;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  position: number;
}

export interface OrderFormState {
  customerName: string;
  phone: string;
  orderDate: string;
  deliveryDate: string;
  deliveryTime: string;
  deliveryMode: UiDeliveryMode;
  deliveryAddress: string;
  deliveryReference: string;
  deliveryDistrict: string;
  deliveryFee: string;
  status: UiOrderStatus;
  paymentMethod: UiPaymentMethod;
  paidAmount: string;
  notes: string;
  items: OrderFormItem[];
}

export interface OrderQueueCardItem {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone?: string;
  orderDate: string;
  deliveryDate: string;
  deliveryTime?: string;
  deliveryMode: UiDeliveryMode;
  deliveryAddress?: string;
  deliveryDistrict?: string;
  status: UiOrderStatus;
  paymentMethod: UiPaymentMethod;
  paymentStatus: UiPaymentStatus;
  notes: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  itemCount: number;
  items: Array<{
    productName: string;
    quantity: number;
  }>;
}

export interface OrderLookupOption {
  id: string;
  orderNumber: string;
  customerName: string;
  label: string;
}
