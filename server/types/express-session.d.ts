import type { AuthUser } from "@shared/types";

declare module "express-session" {
  interface SessionData {
    user?: AuthUser;
  }
}
