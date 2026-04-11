import { z } from "zod";

export const ttsVoiceNoteRequestSchema = z.object({
  text: z.string().trim().min(1).max(1200),
});
