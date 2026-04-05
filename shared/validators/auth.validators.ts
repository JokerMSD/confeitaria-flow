import { z } from "zod";

export const authLoginInputSchema = z.object({
  email: z.string().trim().min(1).email(),
  password: z.string().trim().min(1).max(128),
});

export const authRegisterInputSchema = z.object({
  fullName: z.string().trim().min(1).max(160),
  email: z.string().trim().min(1).email(),
  password: z.string().min(8).max(128),
});

export const authVerifyEmailInputSchema = z.object({
  token: z.string().trim().min(1).max(512),
});

export const authResendVerificationEmailInputSchema = z.object({
  email: z.string().trim().min(1).email(),
});
