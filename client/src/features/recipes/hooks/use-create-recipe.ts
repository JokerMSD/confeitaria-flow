import { useMutation } from "@tanstack/react-query";
import { createRecipe } from "@/api/recipes-api";
import { queryClient } from "@/lib/queryClient";
import { recipeQueryKeys } from "../lib/recipe-query-keys";

export function useCreateRecipe() {
  return useMutation({
    mutationFn: createRecipe,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: recipeQueryKeys.all });
    },
  });
}
