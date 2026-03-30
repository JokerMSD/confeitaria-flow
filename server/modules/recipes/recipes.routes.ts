import type { Express } from "express";
import { z } from "zod";
import {
  createRecipeInputSchema,
  listRecipesFiltersSchema,
  recipeIdParamsSchema,
  recipeKindSchema,
  updateRecipeInputSchema,
} from "@shared/validators";
import { validateRequest } from "../../middlewares/validate-request";
import { RecipesController } from "./recipes.controller";

export function registerRecipesRoutes(app: Express) {
  const controller = new RecipesController();
  const recipeBodySchema = z.object({ data: createRecipeInputSchema });
  const updateRecipeBodySchema = z.object({ data: updateRecipeInputSchema });
  const recipeLookupQuerySchema = z.object({
    kind: recipeKindSchema.optional(),
  });

  app.get("/api/recipes", validateRequest(listRecipesFiltersSchema, "query"), controller.list.bind(controller));
  app.get("/api/recipes/lookup", validateRequest(recipeLookupQuerySchema, "query"), controller.lookup.bind(controller));
  app.get("/api/recipes/:id", validateRequest(recipeIdParamsSchema, "params"), controller.detail.bind(controller));
  app.post("/api/recipes", validateRequest(recipeBodySchema, "body"), controller.create.bind(controller));
  app.put(
    "/api/recipes/:id",
    validateRequest(recipeIdParamsSchema, "params"),
    validateRequest(updateRecipeBodySchema, "body"),
    controller.update.bind(controller),
  );
  app.delete("/api/recipes/:id", validateRequest(recipeIdParamsSchema, "params"), controller.remove.bind(controller));
}
