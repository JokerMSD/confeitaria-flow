import { useQuery } from "@tanstack/react-query";
import { getRecipe } from "@/api/recipes-api";
import { recipeQueryKeys } from "../lib/recipe-query-keys";

export function useRecipe(id?: string) {
  return useQuery({
    queryKey: recipeQueryKeys.detail(id ?? "unknown"),
    queryFn: () => getRecipe(id!),
    enabled: Boolean(id),
  });
}
