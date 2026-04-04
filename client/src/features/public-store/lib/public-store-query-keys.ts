export const publicStoreQueryKeys = {
  all: ["public-store"] as const,
  home: () => ["public-store", "home"] as const,
  paymentConfig: () => ["public-store", "payment-config"] as const,
  availability: (
    deliveryMode: "Entrega" | "Retirada",
    selectedDate?: string,
  ) => ["public-store", "availability", deliveryMode, selectedDate ?? "auto"] as const,
  products: () => ["public-store", "products"] as const,
  product: (id: string) => ["public-store", "product", id] as const,
};
