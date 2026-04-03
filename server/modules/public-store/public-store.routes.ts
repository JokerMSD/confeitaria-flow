import type { Express } from "express";
import { z } from "zod";
import { validateRequest } from "../../middlewares/validate-request";
import { publicCheckoutInputSchema } from "@shared/validators";
import { PublicStoreController } from "./public-store.controller";

const productIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export function registerPublicStoreRoutes(app: Express) {
  const controller = new PublicStoreController();
  const checkoutBodySchema = z.object({ data: publicCheckoutInputSchema });

  app.get("/api/public/store", controller.home.bind(controller));
  app.get("/api/public/store/products", controller.listProducts.bind(controller));
  app.get(
    "/api/public/store/products/:id",
    validateRequest(productIdParamsSchema, "params"),
    controller.detail.bind(controller),
  );
  app.post(
    "/api/public/store/checkout",
    validateRequest(checkoutBodySchema, "body"),
    controller.checkout.bind(controller),
  );
}
