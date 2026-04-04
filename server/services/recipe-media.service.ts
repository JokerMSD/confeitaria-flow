import type {
  CatalogMediaAdminItem,
  CatalogMediaAdminVariationItem,
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
    const productRecipes = (recipes as any[]).filter(
      (recipe) => recipe.kind === "ProdutoVenda",
    );
    const fillingRecipes = (recipes as any[])
      .filter((recipe) => recipe.kind === "Preparacao")
      .sort((a, b) => a.name.localeCompare(b.name));
    const mediaRows = await this.recipeMediaRepository.listByRecipeIds([
      ...productRecipes.map((recipe) => recipe.id),
      ...fillingRecipes.map((recipe) => recipe.id),
    ]);
    const mediaByRecipeId = new Map<string, RecipeMedia[]>();

    for (const row of mediaRows as any[]) {
      const current = mediaByRecipeId.get(row.recipeId) ?? [];
      current.push(this.mapMedia(row));
      mediaByRecipeId.set(row.recipeId, current);
    }

    return productRecipes.map((recipe) => {
      const recipeMedia = mediaByRecipeId.get(recipe.id) ?? [];
      const galleryMedia = recipeMedia.filter((media) => !media.variationRecipeId);
      const variationMediaById = new Map<string, RecipeMedia[]>();

      for (const media of recipeMedia) {
        if (!media.variationRecipeId) {
          continue;
        }

        const current = variationMediaById.get(media.variationRecipeId) ?? [];
        current.push(media);
        variationMediaById.set(media.variationRecipeId, current);
      }

      const variations: CatalogMediaAdminVariationItem[] = fillingRecipes.map((filling) => ({
        variationRecipeId: filling.id,
        variationName: filling.name,
        media: variationMediaById.get(filling.id) ?? [],
        fallbackMedia:
          (mediaByRecipeId.get(filling.id) ?? []).find(
            (media) => !media.variationRecipeId,
          ) ?? null,
      }));

      return {
        recipeId: recipe.id,
        recipeName: recipe.name,
        recipeKind: recipe.kind,
        maxPhotos: 12,
        media: galleryMedia,
        variations,
      };
    });
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

      const variationRecipe = input.variationRecipeId
        ? await this.recipesRepository.findById(input.variationRecipeId, tx)
        : null;

      if (input.variationRecipeId && !variationRecipe) {
        throw new HttpError(404, "Variation recipe not found.");
      }

      if (input.variationRecipeId) {
        if (recipe.kind !== "ProdutoVenda") {
          throw new HttpError(
            400,
            "Fotos por variacao so podem ser vinculadas a ProdutoVenda.",
          );
        }

        if (variationRecipe?.kind !== "Preparacao") {
          throw new HttpError(
            400,
            "A variacao selecionada precisa ser uma receita do tipo Preparacao.",
          );
        }
      }

      const existingMedia = await this.recipeMediaRepository.listByRecipeIds(
        [input.recipeId],
        tx,
      );

      if (input.variationRecipeId) {
        const currentVariationMedia = existingMedia.filter(
          (media: any) => media.variationRecipeId === input.variationRecipeId,
        );

        for (const media of currentVariationMedia as any[]) {
          await removeCatalogMedia(media.fileUrl);
          await this.recipeMediaRepository.markDeleted(media.id, new Date(), tx);
        }
      } else if (recipe.kind === "Preparacao" && existingMedia.length > 0) {
        for (const media of existingMedia as any[]) {
          await removeCatalogMedia(media.fileUrl);
          await this.recipeMediaRepository.markDeleted(media.id, new Date(), tx);
        }
      }

      const defaultMediaCount = existingMedia.filter(
        (media: any) => !media.variationRecipeId,
      ).length;

      if (!input.variationRecipeId && recipe.kind === "ProdutoVenda" && defaultMediaCount >= 12) {
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
          variationRecipeId: input.variationRecipeId ?? null,
          fileUrl,
          altText: input.altText?.trim() || null,
          position:
            input.variationRecipeId || recipe.kind === "Preparacao"
              ? 0
              : defaultMediaCount,
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
      variationRecipeId: row.variationRecipeId ?? null,
      fileUrl: row.fileUrl,
      altText: row.altText ?? null,
      position: row.position,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      deletedAt: toIsoString(row.deletedAt),
    };
  }
}
