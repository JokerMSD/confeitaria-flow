import type {
  CatalogMediaAdminItem,
  RecipeMedia,
  UploadRecipeMediaInput,
} from "@shared/types";
import { withTransaction } from "../db/transaction";
import { RecipesRepository } from "../repositories/recipes.repository";
import { RecipeMediaRepository } from "../repositories/recipe-media.repository";
import { HttpError } from "../utils/http-error";
import { removeCatalogMedia, saveCatalogMedia } from "../utils/catalog-media-storage";

function toIsoString(value: Date | null) {
  return value ? value.toISOString() : null;
}

export class RecipeMediaService {
  private readonly recipesRepository = new RecipesRepository();
  private readonly recipeMediaRepository = new RecipeMediaRepository();

  async listAdminItems(): Promise<CatalogMediaAdminItem[]> {
    const recipes = await this.recipesRepository.list();
    const mediaRows = await this.recipeMediaRepository.listByRecipeIds(
      recipes.map((recipe: any) => recipe.id),
    );
    const mediaByRecipeId = new Map<string, RecipeMedia[]>();

    for (const row of mediaRows as any[]) {
      const current = mediaByRecipeId.get(row.recipeId) ?? [];
      current.push(this.mapMedia(row));
      mediaByRecipeId.set(row.recipeId, current);
    }

    return (recipes as any[])
      .filter((recipe) => recipe.kind === "ProdutoVenda" || recipe.kind === "Preparacao")
      .map((recipe) => ({
        recipeId: recipe.id,
        recipeName: recipe.name,
        recipeKind: recipe.kind,
        maxPhotos: recipe.kind === "Preparacao" ? 1 : 12,
        media: mediaByRecipeId.get(recipe.id) ?? [],
      }));
  }

  async listByRecipeIds(recipeIds: string[]) {
    const rows = await this.recipeMediaRepository.listByRecipeIds(recipeIds);
    const mediaByRecipeId = new Map<string, RecipeMedia[]>();

    for (const row of rows as any[]) {
      const current = mediaByRecipeId.get(row.recipeId) ?? [];
      current.push(this.mapMedia(row));
      mediaByRecipeId.set(row.recipeId, current);
    }

    return mediaByRecipeId;
  }

  async upload(input: UploadRecipeMediaInput) {
    return withTransaction(async (tx) => {
      const recipe = await this.recipesRepository.findById(input.recipeId, tx);

      if (!recipe) {
        throw new HttpError(404, "Recipe not found.");
      }

      const existingMedia = await this.recipeMediaRepository.listByRecipeIds(
        [input.recipeId],
        tx,
      );

      if (recipe.kind === "Preparacao" && existingMedia.length > 0) {
        for (const media of existingMedia as any[]) {
          await removeCatalogMedia(media.fileUrl);
          await this.recipeMediaRepository.markDeleted(media.id, new Date(), tx);
        }
      }

      if (recipe.kind === "ProdutoVenda" && existingMedia.length >= 12) {
        throw new HttpError(400, "Cada produto suporta no maximo 12 fotos.");
      }

      const fileUrl = await saveCatalogMedia({
        recipeId: input.recipeId,
        mimeType: input.mimeType,
        contentBase64: input.contentBase64,
      });

      const created = await this.recipeMediaRepository.create(
        {
          recipeId: input.recipeId,
          fileUrl,
          altText: input.altText?.trim() || null,
          position: recipe.kind === "Preparacao" ? 0 : existingMedia.length,
        },
        tx,
      );

      return this.mapMedia(created);
    });
  }

  async remove(mediaId: string) {
    return withTransaction(async (tx) => {
      const media = await this.recipeMediaRepository.findById(mediaId, tx);

      if (!media) {
        throw new HttpError(404, "Recipe media not found.");
      }

      await removeCatalogMedia(media.fileUrl);
      const deleted = await this.recipeMediaRepository.markDeleted(
        mediaId,
        new Date(),
        tx,
      );

      if (!deleted) {
        throw new HttpError(404, "Recipe media not found.");
      }

      return {
        id: deleted.id,
        deletedAt: deleted.deletedAt?.toISOString() ?? new Date().toISOString(),
      };
    });
  }

  private mapMedia(row: any): RecipeMedia {
    return {
      id: row.id,
      recipeId: row.recipeId,
      fileUrl: row.fileUrl,
      altText: row.altText ?? null,
      position: row.position,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      deletedAt: toIsoString(row.deletedAt),
    };
  }
}
