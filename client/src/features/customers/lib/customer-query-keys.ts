export const customerQueryKeys = {
  all: ["customers"] as const,
  list: () => ["customers", "list"] as const,
  detail: (id: string) => ["customers", "detail", id] as const,
};
