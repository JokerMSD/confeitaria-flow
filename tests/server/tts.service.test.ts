import assert from "node:assert/strict";
import test from "node:test";
import {
  generateVoiceNote,
  prepareTextForSpeech,
} from "../../server/services/tts.service";

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

test("prepareTextForSpeech removes markdown and decorative emoji", () => {
  const prepared = prepareTextForSpeech(
    "Olá! Seja bem-vindo(a) à **Universo Doce**! 🍬✨",
  );

  assert.equal(prepared, "Olá! Seja bem-vindo(a) à Universo Doce!");
});

test("prepareTextForSpeech turns paragraphs into pauses and speech-friendly text", () => {
  const prepared = prepareTextForSpeech(
    "Oi!\n\nQuer cardápio, pedido ou ajuda com encomendas?",
  );

  assert.equal(
    prepared,
    "Oi! ... Quer cardápio, pedido ou ajuda com encomendas?",
  );
});
