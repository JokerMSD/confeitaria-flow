export const customerQueryKeys = {
  all: ["customers"] as const,
  list: (search?: string) => ["customers", "list", search ?? "all"] as const,
  detail: (id: string) => ["customers", "detail", id] as const,
};
