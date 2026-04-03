import { z } from "zod";
import type { UserRole } from "@shared/types";

const userRoleSchema = z.enum(["admin", "operador", "user"] as const);

export const createUserInputSchema = z.object({
  username: z.string().trim().min(3).max(80),
  email: z.string().trim().email(),
  fullName: z.string().trim().min(1).max(160),
  password: z.string().min(8).max(128),
  role: userRoleSchema,
  customerId: z.string().uuid().nullable().optional(),
  photoUrl: z.string().trim().url().nullable().optional(),
  isActive: z.boolean().optional(),
});

export const updateUserInputSchema = z.object({
  username: z.string().trim().min(3).max(80).optional(),
  email: z.string().trim().email().optional(),
  fullName: z.string().trim().min(1).max(160).optional(),
  password: z.string().min(8).max(128).optional(),
  role: userRoleSchema.optional(),
  customerId: z.string().uuid().nullable().optional(),
  photoUrl: z.string().trim().url().nullable().optional(),
  isActive: z.boolean().optional(),
});

export const userIdParamsSchema = z.object({
  id: z.string().uuid(),
});
