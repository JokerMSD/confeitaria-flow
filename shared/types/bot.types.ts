import type { PublicStoreAvailabilityDate } from "./production.types";
import type { DeliveryMode, OrderStatus, PaymentStatus } from "./order-item.types";

export interface BotStoreSummaryProduct {
  id: string;
  name: string;
  notes: string | null;
  priceFromCents: number | null;
  productUrl: string;
  additionalGroupCount: number;
}

export interface BotStoreSummary {
  generatedAt: string;
  storeName: string;
  catalogUrl: string;
  checkoutUrl: string;
  featuredProducts: BotStoreSummaryProduct[];
}

export interface BotStoreSummaryResponse {
  data: BotStoreSummary;
}

export interface BotProductAdditionalGroup {
  id: string;
  name: string;
  minSelections: number;
  maxSelections: number;
  options: Array<{
    id: string;
    name: string;
    priceDeltaCents: number;
  }>;
}

export interface BotProductDetail {
  id: string;
  name: string;
  notes: string | null;
  priceFromCents: number | null;
  productUrl: string;
  checkoutUrl: string;
  fillingOptions: Array<{
    id: string;
    name: string;
  }>;
  additionalGroups: BotProductAdditionalGroup[];
}

export interface BotProductDetailResponse {
  data: BotProductDetail;
}

export interface BotAvailabilityResponse {
  data: {
    generatedAt: string;
    deliveryMode: DeliveryMode;
    selectedDate: string | null;
    availableDates: PublicStoreAvailabilityDate[];
    availableSlots: string[];
    checkoutUrl: string;
  };
}

export interface BotOrderStatusLookupInput {
  customerPhone: string;
  orderNumber?: string | null;
  limit?: number;
}

export interface BotOrderStatusLookupRequest {
  data: BotOrderStatusLookupInput;
}

export interface BotOrderStatusLookupOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  deliveryDate: string;
  deliveryTime: string | null;
  deliveryMode: DeliveryMode;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  subtotalAmountCents: number;
  itemSummary: string;
}

export interface BotOrderStatusLookupResponse {
  data: {
    generatedAt: string;
    matchCount: number;
    orders: BotOrderStatusLookupOrder[];
  };
}

export interface BotCheckoutLinkInput {
  productId?: string | null;
}

export interface BotCheckoutLinkRequest {
  data: BotCheckoutLinkInput;
}

export interface BotCheckoutLinkResponse {
  data: {
    generatedAt: string;
    target: "catalog" | "product" | "checkout";
    url: string;
    message: string;
  };
}
