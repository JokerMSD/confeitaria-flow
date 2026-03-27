import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { registerHealthRoutes } from "./modules/health/health.routes";
import { registerOrdersRoutes } from "./modules/orders/orders.module";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  registerHealthRoutes(app);
  registerOrdersRoutes(app);

  // use storage to perform CRUD operations on the storage interface
  // e.g. storage.insertUser(user) or storage.getUserByUsername(username)
  void storage;

  return httpServer;
}
