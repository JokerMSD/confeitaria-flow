import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { requireAuth } from "./middlewares/require-auth";
import { registerAuthRoutes } from "./modules/auth/auth.module";
import { registerCashRoutes } from "./modules/cash/cash.module";
import { registerHealthRoutes } from "./modules/health/health.routes";
import { registerInventoryRoutes } from "./modules/inventory/inventory.module";
import { registerOrdersRoutes } from "./modules/orders/orders.module";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  registerHealthRoutes(app);
  registerAuthRoutes(app);
  app.use("/api", requireAuth);
  registerOrdersRoutes(app);
  registerCashRoutes(app);
  registerInventoryRoutes(app);

  // use storage to perform CRUD operations on the storage interface
  // e.g. storage.insertUser(user) or storage.getUserByUsername(username)
  void storage;

  return httpServer;
}
