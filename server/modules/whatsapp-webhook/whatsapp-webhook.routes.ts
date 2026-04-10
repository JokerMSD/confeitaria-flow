import type { Express } from "express";
import { WhatsAppWebhookController } from "./whatsapp-webhook.controller";

export function registerWhatsAppWebhookRoutes(app: Express) {
  const controller = new WhatsAppWebhookController();

  app.get("/webhooks/whatsapp", controller.verify.bind(controller));
  app.post("/webhooks/whatsapp", controller.receive.bind(controller));
}
