import type { Express } from "express";
import { z } from "zod";
import {
  confirmInventoryReceiptImportInputSchema,
  createInventoryItemInputSchema,
  inventoryItemIdParamsSchema,
  inventoryReceiptImportInputSchema,
  listInventoryItemsFiltersSchema,
  updateInventoryItemInputSchema,
} from "@shared/validators";
import { validateRequest } from "../../middlewares/validate-request";
import { InventoryController } from "./inventory.controller";
import { InventoryReceiptImportController } from "./inventory-receipt-import.controller";
import { registerInventoryMovementsRoutes } from "./inventory-movements.routes";

export function registerInventoryRoutes(app: Express) {
  const controller = new InventoryController();
  const inventoryReceiptImportController = new InventoryReceiptImportController();
  const createBodySchema = z.object({ data: createInventoryItemInputSchema });
  const updateBodySchema = z.object({ data: updateInventoryItemInputSchema });
  const analyzeReceiptBodySchema = z.object({
    data: inventoryReceiptImportInputSchema,
  });
  const confirmReceiptBodySchema = z.object({
    data: confirmInventoryReceiptImportInputSchema,
  });

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
  app.post(
    "/api/inventory-items/receipt-import/analyze",
    validateRequest(analyzeReceiptBodySchema, "body"),
    inventoryReceiptImportController.analyze.bind(inventoryReceiptImportController),
  );
  app.post(
    "/api/inventory-items/receipt-import/confirm",
    validateRequest(confirmReceiptBodySchema, "body"),
    inventoryReceiptImportController.confirm.bind(inventoryReceiptImportController),
  );

  registerInventoryMovementsRoutes(app);
}
