import type { Express } from "express";
import {
  whatsappAssistantCatalogSearchQuerySchema,
  whatsappAssistantCustomerUpsertSchema,
  whatsappAssistantDraftConfirmSchema,
  whatsappAssistantDraftUpsertSchema,
  whatsappAssistantOrderIdParamsSchema,
  whatsappAssistantPhoneParamsSchema,
} from "@shared/validators";
import { requireBotToken } from "../../middlewares/require-bot-token";
import { validateRequest } from "../../middlewares/validate-request";
import { WhatsAppAssistantController } from "./whatsapp-assistant.controller";

export function registerWhatsAppAssistantRoutes(app: Express) {
  const controller = new WhatsAppAssistantController();

  app.use("/api/whatsapp-assistant", requireBotToken);
  app.get(
    "/api/whatsapp-assistant/customers/by-phone/:phone",
    validateRequest(whatsappAssistantPhoneParamsSchema, "params"),
    controller.customerByPhone.bind(controller),
  );
  app.post(
    "/api/whatsapp-assistant/customers/upsert",
    validateRequest(whatsappAssistantCustomerUpsertSchema, "body"),
    controller.upsertCustomer.bind(controller),
  );
  app.get(
    "/api/whatsapp-assistant/catalog",
    controller.catalog.bind(controller),
  );
  app.get(
    "/api/whatsapp-assistant/catalog/search",
    validateRequest(whatsappAssistantCatalogSearchQuerySchema, "query"),
    controller.searchCatalog.bind(controller),
  );
  app.get(
    "/api/whatsapp-assistant/orders/draft/:phone",
    validateRequest(whatsappAssistantPhoneParamsSchema, "params"),
    controller.draftByPhone.bind(controller),
  );
  app.post(
    "/api/whatsapp-assistant/orders/draft/upsert",
    validateRequest(whatsappAssistantDraftUpsertSchema, "body"),
    controller.upsertDraft.bind(controller),
  );
  app.post(
    "/api/whatsapp-assistant/orders/draft/confirm",
    validateRequest(whatsappAssistantDraftConfirmSchema, "body"),
    controller.confirmDraft.bind(controller),
  );
  app.get(
    "/api/whatsapp-assistant/orders/by-phone/:phone",
    validateRequest(whatsappAssistantPhoneParamsSchema, "params"),
    controller.ordersByPhone.bind(controller),
  );
  app.get(
    "/api/whatsapp-assistant/orders/:id",
    validateRequest(whatsappAssistantOrderIdParamsSchema, "params"),
    controller.orderById.bind(controller),
  );
  app.get(
    "/api/whatsapp-assistant/session/:phone",
    validateRequest(whatsappAssistantPhoneParamsSchema, "params"),
    controller.sessionByPhone.bind(controller),
  );
}
