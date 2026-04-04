import type { Express } from "express";
import { z } from "zod";
import {
  createRecipeInputSchema,
  listRecipesFiltersSchema,
  recipeMediaIdParamsSchema,
  recipeIdParamsSchema,
  recipeKindSchema,
  uploadRecipeMediaInputSchema,
  updateRecipeInputSchema,
} from "@shared/validators";
import { validateRequest } from "../../middlewares/validate-request";
import { RecipesController } from "./recipes.controller";
import { RecipeMediaController } from "./recipe-media.controller";

export function registerRecipesRoutes(app: Express) {
  const controller = new RecipesController();
  const recipeMediaController = new RecipeMediaController();
  const recipeBodySchema = z.object({ data: createRecipeInputSchema });
  const updateRecipeBodySchema = z.object({ data: updateRecipeInputSchema });
  const uploadRecipeMediaBodySchema = z.object({ data: uploadRecipeMediaInputSchema });
  const recipeLookupQuerySchema = z.object({
    kind: recipeKindSchema.optional(),
  });

  app.get("/api/recipes", validateRequest(listRecipesFiltersSchema, "query"), controller.list.bind(controller));
  app.get("/api/recipes/catalog-media", recipeMediaController.listAdmin.bind(recipeMediaController));
  app.get("/api/recipes/lookup", validateRequest(recipeLookupQuerySchema, "query"), controller.lookup.bind(controller));
  app.get("/api/recipes/:id", validateRequest(recipeIdParamsSchema, "params"), controller.detail.bind(controller));
  app.post("/api/recipes", validateRequest(recipeBodySchema, "body"), controller.create.bind(controller));
  app.post(
    "/api/recipes/catalog-media",
    validateRequest(uploadRecipeMediaBodySchema, "body"),
    recipeMediaController.upload.bind(recipeMediaController),
  );
  app.put(
    "/api/recipes/:id",
    validateRequest(recipeIdParamsSchema, "params"),
    validateRequest(updateRecipeBodySchema, "body"),
    controller.update.bind(controller),
  );
  app.delete(
    "/api/recipes/catalog-media/:mediaId",
    validateRequest(recipeMediaIdParamsSchema, "params"),
    recipeMediaController.remove.bind(recipeMediaController),
  );
  app.delete("/api/recipes/:id", validateRequest(recipeIdParamsSchema, "params"), controller.remove.bind(controller));
}
