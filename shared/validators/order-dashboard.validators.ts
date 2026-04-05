import { z } from "zod";
import { operationalDateSchema } from "./common.validators";

export const ordersDashboardSummaryFiltersSchema = z.object({
  dateFrom: operationalDateSchema.optional(),
  dateTo: operationalDateSchema.optional(),
});
