import { z } from "zod";
import type { UserRole } from "@shared/types";

const userRoleSchema = z.enum(["admin", "operador", "user"] as const);
const photoUrlSchema = z
  .string()
  .trim()
  .max(2048)
  .refine(
    (value) => /^https?:\/\//i.test(value) || value.startsWith("/uploads/"),
    "Informe uma URL valida ou um caminho interno de upload.",
  );

export const createUserInputSchema = z.object({
  username: z.string().trim().min(3).max(80),
  email: z.string().trim().email(),
  fullName: z.string().trim().min(1).max(160),
  password: z.string().min(8).max(128),
  role: userRoleSchema,
  customerId: z.string().uuid().nullable().optional(),
  photoUrl: photoUrlSchema.nullable().optional(),
  isActive: z.boolean().optional(),
});

export const updateUserInputSchema = z.object({
  username: z.string().trim().min(3).max(80).optional(),
  email: z.string().trim().email().optional(),
  fullName: z.string().trim().min(1).max(160).optional(),
  password: z.string().min(8).max(128).optional(),
  role: userRoleSchema.optional(),
  customerId: z.string().uuid().nullable().optional(),
  photoUrl: photoUrlSchema.nullable().optional(),
  isActive: z.boolean().optional(),
});

export const userIdParamsSchema = z.object({
  id: z.string().uuid(),
});
