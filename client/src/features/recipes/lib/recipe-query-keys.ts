import type { ListRecipesFilters } from "@shared/types";

export const recipeQueryKeys = {
  all: ["recipes"] as const,
  list: (filters: ListRecipesFilters = {}) => ["recipes", "list", filters] as const,
  detail: (id: string) => ["recipes", "detail", id] as const,
  lookup: (kind?: string) => ["recipes", "lookup", kind ?? "all"] as const,
};
