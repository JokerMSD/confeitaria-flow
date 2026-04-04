import { useMutation, useQuery } from "@tanstack/react-query";
import {
  deleteRecipeMedia,
  getCatalogMediaAdmin,
  uploadRecipeMedia,
} from "@/api/recipes-api";
import { queryClient } from "@/lib/queryClient";
import { recipeQueryKeys } from "../lib/recipe-query-keys";
import { publicStoreQueryKeys } from "@/features/public-store/lib/public-store-query-keys";

function invalidateCatalogMediaQueries() {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: recipeQueryKeys.all }),
    queryClient.invalidateQueries({ queryKey: publicStoreQueryKeys.all }),
  ]);
}

export function useCatalogMediaAdmin() {
  return useQuery({
    queryKey: recipeQueryKeys.catalogMedia(),
    queryFn: getCatalogMediaAdmin,
  });
}

export function useUploadRecipeMedia() {
  return useMutation({
    mutationFn: uploadRecipeMedia,
    onSuccess: invalidateCatalogMediaQueries,
  });
}

export function useDeleteRecipeMedia() {
  return useMutation({
    mutationFn: deleteRecipeMedia,
    onSuccess: invalidateCatalogMediaQueries,
  });
}
