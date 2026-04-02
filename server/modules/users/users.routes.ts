import type { Express } from "express";
import { z } from "zod";
import { UsersController } from "./users.controller";
import { validateRequest } from "../../middlewares/validate-request";
import {
  createUserInputSchema,
  updateUserInputSchema,
  userIdParamsSchema,
} from "@shared/validators";

export function registerUsersRoutes(app: Express) {
  const controller = new UsersController();
  const createBodySchema = z.object({ data: createUserInputSchema });
  const updateBodySchema = z.object({ data: updateUserInputSchema });

  app.get("/api/users", controller.list.bind(controller));
  app.post("/api/users", validateRequest(createBodySchema, "body"), controller.create.bind(controller));
  app.get("/api/users/:id", validateRequest(userIdParamsSchema, "params"), controller.detail.bind(controller));
  app.put("/api/users/:id", validateRequest(userIdParamsSchema, "params"), validateRequest(updateBodySchema, "body"), controller.update.bind(controller));
  app.post("/api/users/:id/activate", validateRequest(userIdParamsSchema, "params"), controller.setActive.bind(controller));
  app.post("/api/users/:id/deactivate", validateRequest(userIdParamsSchema, "params"), controller.setActive.bind(controller));
  app.delete("/api/users/:id", validateRequest(userIdParamsSchema, "params"), controller.remove.bind(controller));
}
