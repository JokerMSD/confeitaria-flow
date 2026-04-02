import type { Express } from "express";
import { z } from "zod";
import {
  createProductAdditionalGroupInputSchema,
  listProductAdditionalGroupsFiltersSchema,
  productAdditionalGroupIdParamsSchema,
  updateProductAdditionalGroupInputSchema,
} from "@shared/validators";
import { validateRequest } from "../../middlewares/validate-request";
import { ProductAdditionalsController } from "./product-additionals.controller";

export function registerProductAdditionalsRoutes(app: Express) {
  const controller = new ProductAdditionalsController();
  const createBodySchema = z.object({
    data: createProductAdditionalGroupInputSchema,
  });
  const updateBodySchema = z.object({
    data: updateProductAdditionalGroupInputSchema,
  });

  app.get(
    "/api/product-additionals",
    validateRequest(listProductAdditionalGroupsFiltersSchema, "query"),
    controller.list.bind(controller),
  );
  app.get(
    "/api/product-additionals/:id",
    validateRequest(productAdditionalGroupIdParamsSchema, "params"),
    controller.detail.bind(controller),
  );
  app.post(
    "/api/product-additionals",
    validateRequest(createBodySchema, "body"),
    controller.create.bind(controller),
  );
  app.put(
    "/api/product-additionals/:id",
    validateRequest(productAdditionalGroupIdParamsSchema, "params"),
    validateRequest(updateBodySchema, "body"),
    controller.update.bind(controller),
  );
  app.delete(
    "/api/product-additionals/:id",
    validateRequest(productAdditionalGroupIdParamsSchema, "params"),
    controller.remove.bind(controller),
  );
}
