import { z } from "zod";

const photoUrlSchema = z
  .string()
  .trim()
  .max(2048)
  .refine(
    (value) => /^https?:\/\//i.test(value) || value.startsWith("/uploads/"),
    "Informe uma URL valida ou um caminho interno de upload.",
  );

export const updateAccountProfileInputSchema = z.object({
  fullName: z.string().trim().min(1).max(160),
  email: z.string().trim().email(),
  phone: z.string().trim().max(40).nullable().optional(),
  photoUrl: photoUrlSchema.nullable().optional(),
});

export const changeAccountPasswordInputSchema = z.object({
  currentPassword: z.string().trim().min(1).max(128),
  newPassword: z.string().min(8).max(128),
});

export const uploadAccountPhotoInputSchema = z.object({
  fileName: z.string().trim().min(1).max(160),
  mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  contentBase64: z.string().trim().min(1).max(4_000_000),
});
