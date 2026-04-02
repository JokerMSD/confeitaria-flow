export const usersQueryKeys = {
  all: ["users"] as const,
  list: () => ["users", "list"] as const,
  detail: (id: string) => ["users", "detail", id] as const,
};
