import assert from "node:assert/strict";
import test from "node:test";
import { generateVoiceNote } from "../../server/services/tts.service";

test("generateVoiceNote rejects empty text", async () => {
  await assert.rejects(
    () => generateVoiceNote("   "),
    /Texto obrigatorio para gerar audio\./,
  );
});

test("generateVoiceNote rejects overly long text", async () => {
  await assert.rejects(
    () => generateVoiceNote("a".repeat(1201)),
    /Texto excede o limite de 1200 caracteres\./,
  );
});
