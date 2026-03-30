import type { Express } from "express";
import { z } from "zod";
import {
  createInventoryItemInputSchema,
  inventoryItemIdParamsSchema,
  listInventoryItemsFiltersSchema,
  updateInventoryItemInputSchema,
} from "@shared/validators";
import { validateRequest } from "../../middlewares/validate-request";
import { InventoryController } from "./inventory.controller";
import { registerInventoryMovementsRoutes } from "./inventory-movements.routes";

export function registerInventoryRoutes(app: Express) {
  const controller = new InventoryController();
  const createBodySchema = z.object({ data: createInventoryItemInputSchema });
  const updateBodySchema = z.object({ data: updateInventoryItemInputSchema });

  app.get(
    "/api/inventory-items",
    validateRequest(listInventoryItemsFiltersSchema, "query"),
    controller.list.bind(controller),
  );
  app.get(
    "/api/inventory-items/purchase-plan",
    controller.purchasePlan.bind(controller),
  );
  app.get(
    "/api/inventory-items/:id",
    validateRequest(inventoryItemIdParamsSchema, "params"),
    controller.detail.bind(controller),
  );
  app.post(
    "/api/inventory-items",
    validateRequest(createBodySchema, "body"),
    controller.create.bind(controller),
  );
  app.put(
    "/api/inventory-items/:id",
    validateRequest(inventoryItemIdParamsSchema, "params"),
    validateRequest(updateBodySchema, "body"),
    controller.update.bind(controller),
  );
  app.delete(
    "/api/inventory-items/:id",
    validateRequest(inventoryItemIdParamsSchema, "params"),
    controller.remove.bind(controller),
  );

  registerInventoryMovementsRoutes(app);
}
