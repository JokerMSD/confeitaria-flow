import type { Express } from "express";
import { z } from "zod";
import {
  createInventoryMovementInputSchema,
  inventoryMovementIdParamsSchema,
  listInventoryMovementsFiltersSchema,
} from "@shared/validators";
import { validateRequest } from "../../middlewares/validate-request";
import { InventoryMovementsController } from "./inventory-movements.controller";

export function registerInventoryMovementsRoutes(app: Express) {
  const controller = new InventoryMovementsController();
  const createBodySchema = z.object({ data: createInventoryMovementInputSchema });

  app.get(
    "/api/inventory-movements",
    validateRequest(listInventoryMovementsFiltersSchema, "query"),
    controller.list.bind(controller),
  );
  app.get(
    "/api/inventory-movements/:id",
    validateRequest(inventoryMovementIdParamsSchema, "params"),
    controller.detail.bind(controller),
  );
  app.post(
    "/api/inventory-movements",
    validateRequest(createBodySchema, "body"),
    controller.create.bind(controller),
  );
}
