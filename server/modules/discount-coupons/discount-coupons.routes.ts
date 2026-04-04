import type { Express } from "express";
import { z } from "zod";
import {
  createDiscountCouponInputSchema,
  discountCouponIdParamsSchema,
  updateDiscountCouponInputSchema,
} from "@shared/validators";
import { validateRequest } from "../../middlewares/validate-request";
import { DiscountCouponsController } from "./discount-coupons.controller";

export function registerDiscountCouponRoutes(app: Express) {
  const controller = new DiscountCouponsController();

  app.get("/api/discount-coupons", controller.list.bind(controller));
  app.get(
    "/api/discount-coupons/:id",
    validateRequest(discountCouponIdParamsSchema, "params"),
    controller.detail.bind(controller),
  );
  app.post(
    "/api/discount-coupons",
    validateRequest(z.object({ data: createDiscountCouponInputSchema }), "body"),
    controller.create.bind(controller),
  );
  app.put(
    "/api/discount-coupons/:id",
    validateRequest(discountCouponIdParamsSchema, "params"),
    validateRequest(z.object({ data: updateDiscountCouponInputSchema }), "body"),
    controller.update.bind(controller),
  );
}
