import type { InventoryItemUnit } from "./inventory.types";
import type { OrderStatus } from "./order-item.types";
import type { ProductAdditionalGroupDetail } from "./product-additional.types";

export interface ProductionForecastAggregate {
  id: string;
  name: string;
  quantity: number;
  unit: InventoryItemUnit;
}

export interface ProductionForecastOrderReference {
  orderId: string;
  orderNumber: string;
  customerName: string;
  deliveryDate: string;
  status: OrderStatus;
}

export interface ProductionForecast {
  generatedAt: string;
  filters: {
    deliveryDate?: string;
    dateFrom?: string;
    dateTo?: string;
  };
  orderCount: number;
  itemCount: number;
  totalsByRecipe: ProductionForecastAggregate[];
  totalsByIngredient: ProductionForecastAggregate[];
  totalsByAdditional: Array<
    ProductionForecastAggregate & {
      groupName: string;
    }
  >;
  highlightedTotals: {
    chocolate: ProductionForecastAggregate[];
    filling: ProductionForecastAggregate[];
    leiteCondensado: ProductionForecastAggregate[];
    cremeDeLeite: ProductionForecastAggregate[];
  };
  orders: ProductionForecastOrderReference[];
}

export interface ProductionForecastResponse {
  data: ProductionForecast;
}

export interface PublicStoreProductSummary {
  id: string;
  name: string;
  notes: string | null;
  outputQuantity: number;
  outputUnit: InventoryItemUnit;
  salePriceCents: number | null;
  effectiveSalePriceCents: number | null;
  additionalGroupCount: number;
}

export interface PublicStoreProductDetail extends PublicStoreProductSummary {
  additionalGroups: ProductAdditionalGroupDetail[];
}

export interface PublicStoreHome {
  generatedAt: string;
  featuredProducts: PublicStoreProductSummary[];
  catalogCount: number;
}

export interface PublicStoreHomeResponse {
  data: PublicStoreHome;
}

export interface PublicStoreProductsResponse {
  data: PublicStoreProductSummary[];
}

export interface PublicStoreProductDetailResponse {
  data: PublicStoreProductDetail;
}

export interface PublicCheckoutItemInput {
  recipeId: string;
  quantity: number;
  additionals?: Array<{
    groupId: string;
    optionId: string;
    position?: number;
  }>;
}

export interface PublicCheckoutInput {
  customerName: string;
  customerPhone?: string | null;
  deliveryMode: "Entrega" | "Retirada";
  deliveryDate: string;
  deliveryTime?: string | null;
  deliveryAddress?: string | null;
  deliveryReference?: string | null;
  deliveryDistrict?: string | null;
  deliveryFeeCents?: number;
  notes?: string | null;
  items: PublicCheckoutItemInput[];
}

export interface PublicCheckoutRequest {
  data: PublicCheckoutInput;
}

export interface PublicCheckoutResponse {
  data: {
    orderId: string;
    orderNumber: string;
    status: OrderStatus;
    paymentMethod: "Pix";
    paymentStatus: "Pendente" | "Parcial" | "Pago";
    subtotalAmountCents: number;
    pixInstructions: string;
  };
}
