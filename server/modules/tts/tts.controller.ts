import type { NextFunction, Request, Response } from "express";
import { HttpError } from "../../utils/http-error";
import { TtsService } from "../../services/tts.service";

function decodeLooseJsonString(value: string) {
  return value
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\n")
    .replace(/\\t/g, "\t")
    .replace(/\\"/g, "\"")
    .replace(/\\\\/g, "\\");
}

function extractTextFromMalformedJson(raw: string) {
  const normalizedRaw = raw.trim().replace(/^body\s*:\s*/i, "");
  const match = normalizedRaw.match(/^\{\s*"text"\s*:\s*"([\s\S]*)"\s*\}\s*$/);

  if (!match) {
    return null;
  }

  return decodeLooseJsonString(match[1]);
}

function normalizeVoiceNoteBody(body: unknown) {
  if (typeof body === "string") {
    const raw = body.trim();

    if (!raw) {
      return { text: "" };
    }

    const normalizedRaw = raw.replace(/^body\s*:\s*/i, "");

    if (normalizedRaw.startsWith("{")) {
      try {
        const parsed = JSON.parse(normalizedRaw) as Record<string, unknown>;

        if (typeof parsed.text === "string") {
          return { text: parsed.text };
        }

        if (
          parsed.body &&
          typeof parsed.body === "object" &&
          parsed.body !== null &&
          typeof (parsed.body as Record<string, unknown>).text === "string"
        ) {
          return { text: (parsed.body as Record<string, string>).text };
        }
      } catch {
        const salvagedText = extractTextFromMalformedJson(normalizedRaw);

        if (typeof salvagedText === "string") {
          return { text: salvagedText };
        }
      }
    }

    return { text: normalizedRaw };
  }

  if (body && typeof body === "object") {
    const record = body as Record<string, unknown>;

    if (typeof record.text === "string") {
      return { text: record.text };
    }

    if (
      record.body &&
      typeof record.body === "object" &&
      record.body !== null &&
      typeof (record.body as Record<string, unknown>).text === "string"
    ) {
      return { text: (record.body as Record<string, string>).text };
    }
  }

  throw new HttpError(400, "Payload de TTS invalido. Envie um campo text.");
}

export function normalizeTtsVoiceNoteRequest(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  try {
    req.body = normalizeVoiceNoteBody(req.body);
    next();
  } catch (error) {
    next(error);
  }
}

export class TtsController {
  private readonly ttsService = new TtsService();

  async voiceNote(req: Request, res: Response) {
    const { buffer, filename } = await this.ttsService.createVoiceNote(req.body.text);

    res.setHeader("content-type", "audio/ogg");
    res.setHeader("content-length", String(buffer.length));
    res.setHeader("content-disposition", `inline; filename="${filename}"`);
    res.send(buffer);
  }
}
