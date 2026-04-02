import type { Express } from "express";
import { z } from "zod";
import { CustomersController } from "./customers.controller";
import { validateRequest } from "../../middlewares/validate-request";
import {
  createCustomerInputSchema,
  customerIdParamsSchema,
  updateCustomerInputSchema,
} from "@shared/validators";

export function registerCustomersRoutes(app: Express) {
  const controller = new CustomersController();
  const createBodySchema = z.object({ data: createCustomerInputSchema });
  const updateBodySchema = z.object({ data: updateCustomerInputSchema });

  app.get("/api/customers", controller.list.bind(controller));
  app.post(
    "/api/customers",
    validateRequest(createBodySchema, "body"),
    controller.create.bind(controller),
  );
  app.get(
    "/api/customers/:id",
    validateRequest(customerIdParamsSchema, "params"),
    controller.detail.bind(controller),
  );
  app.put(
    "/api/customers/:id",
    validateRequest(customerIdParamsSchema, "params"),
    validateRequest(updateBodySchema, "body"),
    controller.update.bind(controller),
  );
  app.post(
    "/api/customers/:id/deactivate",
    validateRequest(customerIdParamsSchema, "params"),
    controller.deactivate.bind(controller),
  );
  app.delete(
    "/api/customers/:id",
    validateRequest(customerIdParamsSchema, "params"),
    controller.remove.bind(controller),
  );
}
