import type { Express } from "express";
import {
  createOrderInputSchema,
  listOrdersFiltersSchema,
  orderIdParamsSchema,
  updateOrderInputSchema,
} from "@shared/validators";
import { OrdersController } from "./orders.controller";
import { validateRequest } from "../../middlewares/validate-request";
import { z } from "zod";

export function registerOrdersRoutes(app: Express) {
  const controller = new OrdersController();
  const orderBodySchema = z.object({ data: createOrderInputSchema });
  const updateOrderBodySchema = z.object({ data: updateOrderInputSchema });

  app.get("/api/orders", validateRequest(listOrdersFiltersSchema, "query"), controller.list.bind(controller));
  app.get("/api/orders/lookup", controller.lookup.bind(controller));
  app.get("/api/orders/queue", controller.queue.bind(controller));
  app.get("/api/orders/:id", validateRequest(orderIdParamsSchema, "params"), controller.detail.bind(controller));
  app.post("/api/orders", validateRequest(orderBodySchema, "body"), controller.create.bind(controller));
  app.put(
    "/api/orders/:id",
    validateRequest(orderIdParamsSchema, "params"),
    validateRequest(updateOrderBodySchema, "body"),
    controller.update.bind(controller),
  );
  app.delete("/api/orders/:id", validateRequest(orderIdParamsSchema, "params"), controller.remove.bind(controller));
}
