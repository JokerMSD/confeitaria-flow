import type {
  CreateRecipeInput,
  ListRecipesFilters,
  RecipeDetail,
  RecipeListItem,
  RecipeLookupItem,
  UpdateRecipeInput,
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
