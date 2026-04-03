import { z } from "zod";

export const updateAccountProfileInputSchema = z.object({
  fullName: z.string().trim().min(1).max(160),
  email: z.string().trim().email(),
  phone: z.string().trim().max(40).nullable().optional(),
  photoUrl: z.string().trim().url().nullable().optional(),
});

export const changeAccountPasswordInputSchema = z.object({
  currentPassword: z.string().trim().min(1).max(128),
  newPassword: z.string().min(8).max(128),
});
