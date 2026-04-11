import type { Express } from "express";
import { ttsVoiceNoteRequestSchema } from "@shared/validators";
import { requireBotToken } from "../../middlewares/require-bot-token";
import { validateRequest } from "../../middlewares/validate-request";
import { TtsController } from "./tts.controller";

export function registerTtsRoutes(app: Express) {
  const controller = new TtsController();

  app.use("/api/tts", requireBotToken);
  app.post(
    "/api/tts/voice-note",
    validateRequest(ttsVoiceNoteRequestSchema, "body"),
    controller.voiceNote.bind(controller),
  );
}
