import { z } from "zod";
import { operationalDateSchema, uuidSchema } from "./common.validators";

export const ordersDashboardSummaryFiltersSchema = z.object({
  dateFrom: operationalDateSchema.optional(),
  dateTo: operationalDateSchema.optional(),
});

export const ordersDashboardDrilldownFiltersSchema =
  ordersDashboardSummaryFiltersSchema.extend({
    kind: z.enum([
      "today",
      "overdue",
      "cancelled",
      "receivable",
      "units-sold",
      "estimated-profit",
      "top-selling-product",
      "most-profitable-product",
    ]),
    recipeId: uuidSchema.optional(),
    productName: z.string().trim().max(160).optional(),
  });
