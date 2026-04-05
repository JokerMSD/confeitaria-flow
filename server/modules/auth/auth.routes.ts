import type { Express } from "express";
import { z } from "zod";
import {
  authLoginInputSchema,
  authRegisterInputSchema,
  authResendVerificationEmailInputSchema,
  authVerifyEmailInputSchema,
} from "@shared/validators";
import { validateRequest } from "../../middlewares/validate-request";
import { AuthController } from "./auth.controller";

export function registerAuthRoutes(app: Express) {
  const controller = new AuthController();
  const loginBodySchema = z.object({ data: authLoginInputSchema });
  const registerBodySchema = z.object({ data: authRegisterInputSchema });
  const verifyEmailBodySchema = z.object({ data: authVerifyEmailInputSchema });
  const resendEmailBodySchema = z.object({
    data: authResendVerificationEmailInputSchema,
  });

  app.post(
    "/api/auth/register",
    validateRequest(registerBodySchema, "body"),
    controller.register.bind(controller),
  );
  app.post(
    "/api/auth/login",
    validateRequest(loginBodySchema, "body"),
    controller.login.bind(controller),
  );
  app.post(
    "/api/auth/verify-email",
    validateRequest(verifyEmailBodySchema, "body"),
    controller.verifyEmail.bind(controller),
  );
  app.post(
    "/api/auth/resend-verification-email",
    validateRequest(resendEmailBodySchema, "body"),
    controller.resendVerificationEmail.bind(controller),
  );
  app.get("/api/auth/me", controller.me.bind(controller));
  app.post("/api/auth/logout", controller.logout.bind(controller));
}
