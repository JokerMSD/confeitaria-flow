import type { ListRecipesFilters } from "@shared/types";
import { useQuery } from "@tanstack/react-query";
import { listRecipes } from "@/api/recipes-api";
import { recipeQueryKeys } from "../lib/recipe-query-keys";

export function useRecipes(filters: ListRecipesFilters = {}) {
  return useQuery({
    queryKey: recipeQueryKeys.list(filters),
    queryFn: () => listRecipes(filters),
  });
}
