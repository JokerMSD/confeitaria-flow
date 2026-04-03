import type { Express } from "express";
import { validateRequest } from "../../middlewares/validate-request";
import { productionForecastFiltersSchema } from "@shared/validators";
import { ProductionController } from "./production.controller";

export function registerProductionRoutes(app: Express) {
  const controller = new ProductionController();

  app.get(
    "/api/production/forecast",
    validateRequest(productionForecastFiltersSchema, "query"),
    controller.forecast.bind(controller),
  );
}
