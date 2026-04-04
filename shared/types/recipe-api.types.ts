import type {
  CatalogMediaAdminItem,
  CreateRecipeInput,
  ListRecipesFilters,
  RecipeDetail,
  RecipeMedia,
  RecipeListItem,
  RecipeLookupItem,
  UpdateRecipeInput,
  UploadRecipeMediaInput,
} from "./recipe.types";

export interface ListRecipesResponse {
  data: RecipeListItem[];
  filters: ListRecipesFilters;
}

export interface RecipeDetailResponse {
  data: RecipeDetail;
}

export interface RecipeLookupResponse {
  data: RecipeLookupItem[];
}

export interface CreateRecipeRequest {
  data: CreateRecipeInput;
}

export interface UpdateRecipeRequest {
  data: UpdateRecipeInput;
}

export interface DeleteRecipeResponse {
  data: {
    id: string;
    deletedAt: string;
  };
}

export interface CatalogMediaAdminResponse {
  data: CatalogMediaAdminItem[];
}

export interface UploadRecipeMediaRequest {
  data: UploadRecipeMediaInput;
}

export interface RecipeMediaResponse {
  data: RecipeMedia;
}

export interface DeleteRecipeMediaResponse {
  data: {
    id: string;
    deletedAt: string;
  };
}
