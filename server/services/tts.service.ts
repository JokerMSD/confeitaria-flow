import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { EdgeTTS } from "edge-tts-universal";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import { HttpError } from "../utils/http-error";

const EDGE_TTS_VOICE = "pt-BR-FranciscaNeural";
const TTS_TIMEOUT_MS = 15_000;
const TTS_TEXT_LIMIT = 1_200;
const VOICE_NOTE_BITRATE = "24k";

if (ffmpegPath) {
  ffmpeg.setFfmpegPath(ffmpegPath);
}

function sanitizeTtsText(rawText: string) {
  return rawText.replace(/\s+/g, " ").trim();
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
  const normalizedText = sanitizeTtsText(text);

  if (!normalizedText) {
    throw new HttpError(400, "Texto obrigatorio para gerar audio.");
  }

  if (normalizedText.length > TTS_TEXT_LIMIT) {
    throw new HttpError(400, `Texto excede o limite de ${TTS_TEXT_LIMIT} caracteres.`);
  }

  const tempMp3Path = path.join(os.tmpdir(), `confeitaria-flow-tts-${randomUUID()}.mp3`);

  try {
    const tts = new EdgeTTS(normalizedText, EDGE_TTS_VOICE);
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
  const normalizedText = sanitizeTtsText(text);

  if (!normalizedText) {
    throw new HttpError(400, "Texto obrigatorio para gerar audio.");
  }

  console.info("[tts] voice note requested", {
    length: normalizedText.length,
    voice: EDGE_TTS_VOICE,
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
