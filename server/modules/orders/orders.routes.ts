import type { Express } from "express";
import {
  createOrderInputSchema,
  listOrdersFiltersSchema,
  ordersDashboardSummaryFiltersSchema,
  orderIdParamsSchema,
  updateOrderStatusInputSchema,
  updateOrderInputSchema,
} from "@shared/validators";
import { OrdersController } from "./orders.controller";
import { validateRequest } from "../../middlewares/validate-request";
import { z } from "zod";

export function registerOrdersRoutes(app: Express) {
  const controller = new OrdersController();
  const orderBodySchema = z.object({ data: createOrderInputSchema });
  const updateOrderBodySchema = z.object({ data: updateOrderInputSchema });
  const updateOrderStatusBodySchema = z.object({ data: updateOrderStatusInputSchema });

  app.get("/api/orders", validateRequest(listOrdersFiltersSchema, "query"), controller.list.bind(controller));
  app.get("/api/orders/lookup", controller.lookup.bind(controller));
  app.get("/api/orders/queue", controller.queue.bind(controller));
  app.get(
    "/api/orders/dashboard-summary",
    validateRequest(ordersDashboardSummaryFiltersSchema, "query"),
    controller.dashboardSummary.bind(controller),
  );
  app.get("/api/orders/:id", validateRequest(orderIdParamsSchema, "params"), controller.detail.bind(controller));
  app.post("/api/orders", validateRequest(orderBodySchema, "body"), controller.create.bind(controller));
  app.put(
    "/api/orders/:id",
    validateRequest(orderIdParamsSchema, "params"),
    validateRequest(updateOrderBodySchema, "body"),
    controller.update.bind(controller),
  );
  app.post(
    "/api/orders/:id/confirm",
    validateRequest(orderIdParamsSchema, "params"),
    controller.confirm.bind(controller),
  );
  app.post(
    "/api/orders/:id/status",
    validateRequest(orderIdParamsSchema, "params"),
    validateRequest(updateOrderStatusBodySchema, "body"),
    controller.updateStatus.bind(controller),
  );
  app.delete("/api/orders/:id", validateRequest(orderIdParamsSchema, "params"), controller.remove.bind(controller));
}
