import type { Express } from "express";
import { type Server } from "http";
import { storage } from "./storage";
import { requireAuth } from "./middlewares/require-auth";
import { registerAuthRoutes } from "./modules/auth/auth.module";
import { registerCashRoutes } from "./modules/cash/cash.module";
import { registerHealthRoutes } from "./modules/health/health.routes";
import { registerInventoryRoutes } from "./modules/inventory/inventory.module";
import { registerOrdersRoutes } from "./modules/orders/orders.module";
import { registerRecipesRoutes } from "./modules/recipes/recipes.module";

export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {
  registerHealthRoutes(app);
  registerAuthRoutes(app);
  app.use("/api", requireAuth);
  registerOrdersRoutes(app);
  registerCashRoutes(app);
  registerInventoryRoutes(app);
  registerRecipesRoutes(app);

  void storage;

  return httpServer;
}
