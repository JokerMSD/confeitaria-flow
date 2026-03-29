import type { Express } from "express";
import { z } from "zod";
import { authLoginInputSchema } from "@shared/validators";
import { validateRequest } from "../../middlewares/validate-request";
import { AuthController } from "./auth.controller";

export function registerAuthRoutes(app: Express) {
  const controller = new AuthController();
  const loginBodySchema = z.object({ data: authLoginInputSchema });

  app.post(
    "/api/auth/login",
    validateRequest(loginBodySchema, "body"),
    controller.login.bind(controller),
  );
  app.get("/api/auth/me", controller.me.bind(controller));
  app.post("/api/auth/logout", controller.logout.bind(controller));
}
