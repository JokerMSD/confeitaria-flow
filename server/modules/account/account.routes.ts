import type { Express } from "express";
import { z } from "zod";
import {
  changeAccountPasswordInputSchema,
  uploadAccountPhotoInputSchema,
  updateAccountProfileInputSchema,
} from "@shared/validators";
import { validateRequest } from "../../middlewares/validate-request";
import { AccountController } from "./account.controller";

export function registerAccountRoutes(app: Express) {
  const controller = new AccountController();

  app.get("/api/account", controller.profile.bind(controller));
  app.get("/api/account/orders", controller.orders.bind(controller));
  app.put(
    "/api/account/profile",
    validateRequest(z.object({ data: updateAccountProfileInputSchema }), "body"),
    controller.updateProfile.bind(controller),
  );
  app.put(
    "/api/account/password",
    validateRequest(z.object({ data: changeAccountPasswordInputSchema }), "body"),
    controller.changePassword.bind(controller),
  );
  app.post(
    "/api/account/photo",
    validateRequest(z.object({ data: uploadAccountPhotoInputSchema }), "body"),
    controller.uploadPhoto.bind(controller),
  );
}
