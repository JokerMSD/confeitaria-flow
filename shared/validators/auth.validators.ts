import { z } from "zod";

export const authLoginInputSchema = z.object({
  email: z.string().trim().min(1).email(),
  password: z.string().trim().min(1).max(128),
});
