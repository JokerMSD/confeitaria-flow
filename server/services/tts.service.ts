import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { EdgeTTS } from "edge-tts-universal";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import { HttpError } from "../utils/http-error";

const DEFAULT_TTS_VOICE = process.env.TTS_VOICE?.trim() || "pt-BR-BrendaNeural";
const DEFAULT_TTS_RATE = process.env.TTS_RATE?.trim() || "-12%";
const DEFAULT_TTS_VOLUME = process.env.TTS_VOLUME?.trim() || "+0%";
const DEFAULT_TTS_PITCH = process.env.TTS_PITCH?.trim() || "+0Hz";
const TTS_TIMEOUT_MS = 15_000;
const TTS_TEXT_LIMIT = 1_200;
const VOICE_NOTE_BITRATE = "24k";

if (ffmpegPath) {
  ffmpeg.setFfmpegPath(ffmpegPath);
}

function sanitizeTtsText(rawText: string) {
  return rawText.replace(/\s+/g, " ").trim();
}

function removeMarkdownSyntax(rawText: string) {
  return rawText
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
    .replace(/[*_~`>#]+/g, "");
}

function removeDecorativeUnicode(rawText: string) {
  return rawText
    .replace(/[\u2600-\u27BF]/g, " ")
    .replace(/[\uD83C-\uDBFF][\uDC00-\uDFFF]/g, " ")
    .replace(/[\uFE0F\u200D]/g, " ");
}

function normalizeSpeechPunctuation(rawText: string) {
  return rawText
    .replace(/[;]+/g, ". ")
    .replace(/[:]+/g, ". ")
    .replace(/\s*\/\s*/g, ", ou ")
    .replace(/\s*&\s*/g, " e ")
    .replace(/([!?]){2,}/g, "$1")
    .replace(/\.{3,}/g, ". ")
    .replace(/\s*,\s*,+/g, ", ")
    .replace(/\s*\.\s*\./g, ". ")
    .replace(/\s{2,}/g, " ");
}

function humanizeParagraphForSpeech(paragraph: string) {
  let spokenParagraph = paragraph.trim();

  if (!spokenParagraph) {
    return "";
  }

  spokenParagraph = spokenParagraph
    .replace(/\b(\d{2})\/(\d{2})\/(\d{4})\b/g, "$1 de $2 de $3")
    .replace(/\b(\d{2}):(\d{2})\b/g, "$1 e $2")
    .replace(/\bR\$\s*([0-9]+)([.,]([0-9]{1,2}))?/g, (_match, reais: string, _decimal: string, centavos?: string) => {
      if (!centavos || centavos === "00") {
        return `${reais} reais`;
      }

      return `${reais} reais e ${centavos} centavos`;
    })
    .replace(/\bkg\b/gi, " quilos")
    .replace(/\bg\b/gi, " gramas")
    .replace(/\bml\b/gi, " ml")
    .replace(/\bwhatsapp\b/gi, "WhatsApp");

  if (!/[.!?]$/.test(spokenParagraph)) {
    spokenParagraph = `${spokenParagraph}.`;
  }

  return sanitizeTtsText(spokenParagraph);
}

export function prepareTextForSpeech(rawText: string) {
  const textWithoutMarkdown = removeMarkdownSyntax(rawText);
  const textWithoutDecorativeUnicode = removeDecorativeUnicode(textWithoutMarkdown)
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n");

  const normalizedParagraphs = textWithoutDecorativeUnicode
    .split(/\n{2,}/)
    .map((paragraph) => normalizeSpeechPunctuation(paragraph))
    .map((paragraph) => humanizeParagraphForSpeech(paragraph))
    .filter(Boolean);

  const spokenText = normalizedParagraphs.join(" ... ");
  return sanitizeTtsText(spokenText);
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string) {
  return new Promise<T>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new HttpError(504, `${label} demorou mais que o esperado.`));
    }, timeoutMs);

    promise.then(
      (value) => {
        clearTimeout(timeout);
        resolve(value);
      },
      (error) => {
        clearTimeout(timeout);
        reject(error);
      },
    );
  });
}

async function removeTemporaryFiles(paths: string[]) {
  await Promise.all(
    paths.map(async (filePath) => {
      try {
        await fs.unlink(filePath);
      } catch {
        // Cleanup should never fail the request.
      }
    }),
  );
}

function convertMp3ToOggOpus(inputPath: string, outputPath: string) {
  return new Promise<void>((resolve, reject) => {
    ffmpeg(inputPath)
      .audioCodec("libopus")
      .audioBitrate(VOICE_NOTE_BITRATE)
      .audioChannels(1)
      .format("ogg")
      .on("end", () => resolve())
      .on("error", (error: Error) => reject(error))
      .save(outputPath);
  });
}

async function generateTemporaryMp3(text: string): Promise<string> {
  const normalizedText = prepareTextForSpeech(text);

  if (!normalizedText) {
    throw new HttpError(400, "Texto obrigatorio para gerar audio.");
  }

  if (normalizedText.length > TTS_TEXT_LIMIT) {
    throw new HttpError(400, `Texto excede o limite de ${TTS_TEXT_LIMIT} caracteres.`);
  }

  const tempMp3Path = path.join(os.tmpdir(), `confeitaria-flow-tts-${randomUUID()}.mp3`);

  try {
    const tts = new EdgeTTS(normalizedText, DEFAULT_TTS_VOICE, {
      rate: DEFAULT_TTS_RATE,
      volume: DEFAULT_TTS_VOLUME,
      pitch: DEFAULT_TTS_PITCH,
    });
    const result = await withTimeout(
      tts.synthesize(),
      TTS_TIMEOUT_MS,
      "A geracao de voz",
    );
    const audioBuffer = Buffer.from(await result.audio.arrayBuffer());

    await fs.writeFile(tempMp3Path, audioBuffer);
    return tempMp3Path;
  } catch (error) {
    await removeTemporaryFiles([tempMp3Path]);
    console.error("[tts] edge synthesis failed.", error);
    throw new HttpError(502, "Nao foi possivel gerar o audio agora.");
  }
}

export async function generateVoiceNote(text: string): Promise<Buffer> {
  const normalizedText = prepareTextForSpeech(text);

  if (!normalizedText) {
    throw new HttpError(400, "Texto obrigatorio para gerar audio.");
  }

  console.info("[tts] voice note requested", {
    length: normalizedText.length,
    voice: DEFAULT_TTS_VOICE,
    rate: DEFAULT_TTS_RATE,
    pitch: DEFAULT_TTS_PITCH,
  });

  const tempMp3Path = await generateTemporaryMp3(normalizedText);
  const tempOggPath = path.join(os.tmpdir(), `confeitaria-flow-tts-${randomUUID()}.ogg`);

  try {
    await withTimeout(
      convertMp3ToOggOpus(tempMp3Path, tempOggPath),
      TTS_TIMEOUT_MS,
      "A conversao de audio",
    );
    const buffer = await fs.readFile(tempOggPath);

    console.info("[tts] voice note generated", {
      bytes: buffer.length,
    });

    return buffer;
  } catch (error) {
    console.error("[tts] ogg conversion failed.", error);
    if (error instanceof HttpError) {
      throw error;
    }
    throw new HttpError(502, "Nao foi possivel converter o audio agora.");
  } finally {
    await removeTemporaryFiles([tempMp3Path, tempOggPath]);
  }
}

export class TtsService {
  async createVoiceNote(text: string) {
    const buffer = await generateVoiceNote(text);

    return {
      buffer,
      filename: "voice-note.ogg",
    };
  }
}
