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
  createdAt: string;
  updatedAt: string;
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
}
