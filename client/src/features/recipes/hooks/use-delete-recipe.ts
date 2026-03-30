import { useMutation } from "@tanstack/react-query";
import { deleteRecipe } from "@/api/recipes-api";
import { queryClient } from "@/lib/queryClient";
import { recipeQueryKeys } from "../lib/recipe-query-keys";

export function useDeleteRecipe() {
  return useMutation({
    mutationFn: deleteRecipe,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: recipeQueryKeys.all });
    },
  });
}
