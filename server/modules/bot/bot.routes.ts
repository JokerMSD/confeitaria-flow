import type { Express } from "express";
import { z } from "zod";
import {
  botAvailabilityQuerySchema,
  botCheckoutLinkRequestSchema,
  botOrderStatusLookupRequestSchema,
} from "@shared/validators";
import { requireBotToken } from "../../middlewares/require-bot-token";
import { validateRequest } from "../../middlewares/validate-request";
import { BotController } from "./bot.controller";

const productIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export function registerBotRoutes(app: Express) {
  const controller = new BotController();

  app.use("/api/bot", requireBotToken);
  app.get("/api/bot/store-summary", controller.storeSummary.bind(controller));
  app.get(
    "/api/bot/products/:id",
    validateRequest(productIdParamsSchema, "params"),
    controller.productDetail.bind(controller),
  );
  app.get(
    "/api/bot/availability",
    validateRequest(botAvailabilityQuerySchema, "query"),
    controller.availability.bind(controller),
  );
  app.post(
    "/api/bot/order-status",
    validateRequest(botOrderStatusLookupRequestSchema, "body"),
    controller.orderStatus.bind(controller),
  );
  app.post(
    "/api/bot/checkout-link",
    validateRequest(botCheckoutLinkRequestSchema, "body"),
    controller.checkoutLink.bind(controller),
  );
}
