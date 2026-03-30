import { useQuery } from "@tanstack/react-query";
import { getRecipesLookup } from "@/api/recipes-api";
import { recipeQueryKeys } from "../lib/recipe-query-keys";

export function useProductRecipes() {
  return useQuery({
    queryKey: recipeQueryKeys.lookup("ProdutoVenda"),
    queryFn: () => getRecipesLookup("ProdutoVenda"),
  });
}
