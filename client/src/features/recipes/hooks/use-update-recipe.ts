import { useMutation } from "@tanstack/react-query";
import { updateRecipe } from "@/api/recipes-api";
import { queryClient } from "@/lib/queryClient";
import { recipeQueryKeys } from "../lib/recipe-query-keys";

export function useUpdateRecipe() {
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof updateRecipe>[1] }) =>
      updateRecipe(id, payload),
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: recipeQueryKeys.all }),
        queryClient.invalidateQueries({
          queryKey: recipeQueryKeys.detail(variables.id),
        }),
      ]);
    },
  });
}
