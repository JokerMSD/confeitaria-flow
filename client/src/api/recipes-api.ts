import type {
  CatalogMediaAdminResponse,
  CreateRecipeRequest,
  DeleteRecipeMediaResponse,
  DeleteRecipeResponse,
  ListRecipesFilters,
  ListRecipesResponse,
  RecipeMediaResponse,
  RecipeDetailResponse,
  RecipeLookupResponse,
  UpdateRecipeRequest,
  UploadRecipeMediaRequest,
} from "@shared/types";
import { httpClient } from "./http-client";

function buildRecipesQuery(filters: ListRecipesFilters = {}) {
  const params = new URLSearchParams();

  if (filters.search) params.set("search", filters.search);
  if (filters.kind) params.set("kind", filters.kind);

  const query = params.toString();
  return query ? `/api/recipes?${query}` : "/api/recipes";
}

export function listRecipes(filters: ListRecipesFilters = {}) {
  return httpClient<ListRecipesResponse>(buildRecipesQuery(filters));
}

export function getRecipe(id: string) {
  return httpClient<RecipeDetailResponse>(`/api/recipes/${id}`);
}

export function getRecipesLookup(kind?: string) {
  const query = kind ? `?kind=${encodeURIComponent(kind)}` : "";
  return httpClient<RecipeLookupResponse>(`/api/recipes/lookup${query}`);
}

export function createRecipe(payload: CreateRecipeRequest) {
  return httpClient<RecipeDetailResponse>("/api/recipes", {
    method: "POST",
    body: payload,
  });
}

export function updateRecipe(id: string, payload: UpdateRecipeRequest) {
  return httpClient<RecipeDetailResponse>(`/api/recipes/${id}`, {
    method: "PUT",
    body: payload,
  });
}

export function deleteRecipe(id: string) {
  return httpClient<DeleteRecipeResponse>(`/api/recipes/${id}`, {
    method: "DELETE",
  });
}

export function getCatalogMediaAdmin() {
  return httpClient<CatalogMediaAdminResponse>("/api/recipes/catalog-media");
}

export function uploadRecipeMedia(payload: UploadRecipeMediaRequest) {
  return httpClient<RecipeMediaResponse>("/api/recipes/catalog-media", {
    method: "POST",
    body: payload,
  });
}

export function deleteRecipeMedia(mediaId: string) {
  return httpClient<DeleteRecipeMediaResponse>(`/api/recipes/catalog-media/${mediaId}`, {
    method: "DELETE",
  });
}
