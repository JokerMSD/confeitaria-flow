import type { Express } from "express";
import { type Server } from "http";
import { storage } from "./storage";
import { requireAuth } from "./middlewares/require-auth";
import { requireStaff } from "./middlewares/require-staff";
import { registerAccountRoutes } from "./modules/account/account.module";
import { registerAuthRoutes } from "./modules/auth/auth.module";
import { registerCashRoutes } from "./modules/cash/cash.module";
import { registerHealthRoutes } from "./modules/health/health.routes";
import { registerInventoryRoutes } from "./modules/inventory/inventory.module";
import { registerOrdersRoutes } from "./modules/orders/orders.module";
import { registerProductAdditionalsRoutes } from "./modules/product-additionals/product-additionals.module";
import { registerRecipesRoutes } from "./modules/recipes/recipes.module";
import { registerCustomersRoutes } from "./modules/customers/customers.module";
import { registerUsersRoutes } from "./modules/users/users.module";
import { registerProductionRoutes } from "./modules/production/production.module";
import { registerPublicStoreRoutes } from "./modules/public-store/public-store.module";
import { registerDiscountCouponRoutes } from "./modules/discount-coupons/discount-coupons.module";

export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {
  registerHealthRoutes(app);
  registerAuthRoutes(app);
  registerPublicStoreRoutes(app);
  app.use("/api", requireAuth);
  registerAccountRoutes(app);
  app.use("/api", requireStaff);
  registerOrdersRoutes(app);
  registerCashRoutes(app);
  registerInventoryRoutes(app);
  registerCustomersRoutes(app);
  registerUsersRoutes(app);
  registerDiscountCouponRoutes(app);
  registerRecipesRoutes(app);
  registerProductAdditionalsRoutes(app);
  registerProductionRoutes(app);

  void storage;

  return httpServer;
}
