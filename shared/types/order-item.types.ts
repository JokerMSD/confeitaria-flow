export type OrderStatus =
  | "Novo"
  | "Confirmado"
  | "EmProducao"
  | "Pronto"
  | "Entregue"
  | "Cancelado";

export type PaymentStatus = "Pendente" | "Parcial" | "Pago";

export type PaymentMethod =
  | "Pix"
  | "Dinheiro"
  | "CartaoCredito"
  | "CartaoDebito"
  | "Transferencia";

export type DeliveryMode = "Entrega" | "Retirada";

export interface OrderItemAdditional {
  id: string;
  orderItemId: string;
  groupId: string;
  optionId: string;
  groupName: string;
  optionName: string;
  priceDeltaCents: number;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  recipeId: string | null;
  fillingRecipeId: string | null;
  secondaryFillingRecipeId: string | null;
  tertiaryFillingRecipeId: string | null;
  productName: string;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
  position: number;
  additionals: OrderItemAdditional[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderItemAdditionalInput {
  groupId: string;
  optionId: string;
  position?: number;
}

export interface CreateOrderItemInput {
  recipeId?: string | null;
  fillingRecipeId?: string | null;
  secondaryFillingRecipeId?: string | null;
  tertiaryFillingRecipeId?: string | null;
  productName: string;
  quantity: number;
  unitPriceCents: number;
  position?: number;
  additionals?: CreateOrderItemAdditionalInput[];
}
