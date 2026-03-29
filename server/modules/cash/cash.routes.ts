import type { Express } from "express";
import { z } from "zod";
import {
  cashTransactionIdParamsSchema,
  createCashTransactionInputSchema,
  getCashSummaryFiltersSchema,
  listCashTransactionsFiltersSchema,
  updateCashTransactionInputSchema,
} from "@shared/validators";
import { validateRequest } from "../../middlewares/validate-request";
import { CashController } from "./cash.controller";

export function registerCashRoutes(app: Express) {
  const controller = new CashController();
  const createBodySchema = z.object({ data: createCashTransactionInputSchema });
  const updateBodySchema = z.object({ data: updateCashTransactionInputSchema });

  app.get(
    "/api/cash-summary",
    validateRequest(getCashSummaryFiltersSchema, "query"),
    controller.summary.bind(controller),
  );
  app.get(
    "/api/cash-transactions",
    validateRequest(listCashTransactionsFiltersSchema, "query"),
    controller.list.bind(controller),
  );
  app.get(
    "/api/cash-transactions/:id",
    validateRequest(cashTransactionIdParamsSchema, "params"),
    controller.detail.bind(controller),
  );
  app.post(
    "/api/cash-transactions",
    validateRequest(createBodySchema, "body"),
    controller.create.bind(controller),
  );
  app.put(
    "/api/cash-transactions/:id",
    validateRequest(cashTransactionIdParamsSchema, "params"),
    validateRequest(updateBodySchema, "body"),
    controller.update.bind(controller),
  );
  app.delete(
    "/api/cash-transactions/:id",
    validateRequest(cashTransactionIdParamsSchema, "params"),
    controller.remove.bind(controller),
  );
}
