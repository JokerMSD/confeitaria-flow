import type { InventoryItemUnit } from "./inventory.types";
import type { OrderStatus } from "./order-item.types";
import type { ProductAdditionalGroupDetail } from "./product-additional.types";
import type { AppliedDiscountCoupon } from "./discount-coupon.types";

export interface ProductionForecastAggregate {
  id: string;
  name: string;
  quantity: number;
  unit: InventoryItemUnit;
  recipeEquivalentQuantity?: number | null;
  recipeEquivalentUnit?: InventoryItemUnit | null;
}

export interface ProductionForecastPurchaseSuggestion {
  itemId: string;
  itemName: string;
  itemUnit: InventoryItemUnit;
  recipeEquivalentQuantity?: number | null;
  recipeEquivalentUnit?: InventoryItemUnit | null;
  currentQuantity: number;
  requiredQuantity: number;
  deficitQuantity: number;
  suggestedPurchaseQuantity: number;
  estimatedPurchaseCostCents: number | null;
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
  purchaseSuggestions: {
    shortageItemCount: number;
    estimatedPurchaseCostCents: number;
    hasItemsWithoutCost: boolean;
    items: ProductionForecastPurchaseSuggestion[];
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
  primaryImageUrl: string | null;
  outputQuantity: number;
  outputUnit: InventoryItemUnit;
  salePriceCents: number | null;
  effectiveSalePriceCents: number | null;
  additionalGroupCount: number;
}

export interface PublicStoreFillingOption {
  id: string;
  name: string;
  photoUrl: string | null;
  hasProductSpecificPhoto?: boolean;
}

export interface PublicStoreProductDetail extends PublicStoreProductSummary {
  imageUrls: string[];
  fillingOptions: PublicStoreFillingOption[];
  minFillings: number;
  maxFillings: number;
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
  fillingRecipeId?: string | null;
  secondaryFillingRecipeId?: string | null;
  tertiaryFillingRecipeId?: string | null;
  additionals?: Array<{
    groupId: string;
    optionId: string;
    position?: number;
  }>;
}

export interface PublicCheckoutInput {
  customerName: string;
  customerPhone?: string | null;
  customerEmail?: string | null;
  deliveryMode: "Entrega" | "Retirada";
  deliveryDate: string;
  deliveryTime?: string | null;
  deliveryAddress?: string | null;
  deliveryReference?: string | null;
  deliveryDistrict?: string | null;
  deliveryFeeCents?: number;
  couponCode?: string | null;
  paymentMethod?: "Pix" | "MercadoPagoCartao";
  payer?: {
    email: string;
    identificationType: "CPF" | "CNPJ";
    identificationNumber: string;
  } | null;
  mercadoPagoCard?: {
    token: string;
    paymentMethodId: string;
    issuerId?: string | null;
    installments: number;
    cardholderName?: string | null;
    lastFourDigits?: string | null;
  } | null;
  notes?: string | null;
  items: PublicCheckoutItemInput[];
}

export interface PublicCheckoutPricingPreviewInput {
  deliveryMode: "Entrega" | "Retirada";
  deliveryFeeCents?: number;
  couponCode?: string | null;
  items: PublicCheckoutItemInput[];
}

export interface PublicCheckoutRequest {
  data: PublicCheckoutInput;
}

export interface PublicCheckoutPricingPreviewRequest {
  data: PublicCheckoutPricingPreviewInput;
}

export interface PublicCheckoutResponse {
  data: {
    orderId: string;
    orderNumber: string;
    status: OrderStatus;
    paymentMethod: "Pix" | "CartaoCredito";
    paymentStatus: "Pendente" | "Parcial" | "Pago";
    paymentProvider: string | null;
    paymentProviderStatus: string | null;
    paymentProviderStatusDetail: string | null;
    itemsSubtotalAmountCents: number;
    discountAmountCents: number;
    appliedCoupon: AppliedDiscountCoupon | null;
    subtotalAmountCents: number;
    paymentInstructions: string | null;
  };
}

export interface PublicStorePaymentConfigResponse {
  data: {
    pixEnabled: true;
    mercadoPago: {
      enabled: boolean;
      publicKey: string | null;
    };
  };
}

export interface PublicStoreAvailabilityDate {
  date: string;
  label: string;
  weekdayLabel: string;
  availableSlotCount: number;
}

export interface PublicStoreAvailabilityResponse {
  data: {
    generatedAt: string;
    deliveryMode: "Entrega" | "Retirada";
    selectedDate: string | null;
    availableDates: PublicStoreAvailabilityDate[];
    availableSlots: string[];
  };
}
