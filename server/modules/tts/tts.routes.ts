import express, { type Express } from "express";
import { ttsVoiceNoteRequestSchema } from "@shared/validators";
import { requireBotToken } from "../../middlewares/require-bot-token";
import { validateRequest } from "../../middlewares/validate-request";
import { normalizeTtsVoiceNoteRequest, TtsController } from "./tts.controller";

export function registerTtsRoutes(app: Express) {
  const controller = new TtsController();

  app.use("/api/tts", requireBotToken);
  app.post(
    "/api/tts/voice-note",
    express.text({
      type: ["application/json", "text/plain"],
      limit: "100kb",
    }),
    normalizeTtsVoiceNoteRequest,
    validateRequest(ttsVoiceNoteRequestSchema, "body"),
    controller.voiceNote.bind(controller),
  );
}
