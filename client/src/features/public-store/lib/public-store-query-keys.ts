export const publicStoreQueryKeys = {
  home: () => ["public-store", "home"] as const,
  products: () => ["public-store", "products"] as const,
  product: (id: string) => ["public-store", "product", id] as const,
};
