export const publicStoreQueryKeys = {
  all: ["public-store"] as const,
  home: () => ["public-store", "home"] as const,
  products: () => ["public-store", "products"] as const,
  product: (id: string) => ["public-store", "product", id] as const,
};
