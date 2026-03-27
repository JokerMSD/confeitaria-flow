import { z } from "zod";

export const uuidSchema = z.string().uuid();

export const centsSchema = z
  .number()
  .int()
  .min(0, "Monetary values must be non-negative integer cents.");

export const operationalDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
  message: "Expected operational date in YYYY-MM-DD format.",
});

export const deliveryTimeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: "Expected delivery time in HH:mm format.",
  });
