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

function extractTextFromParts(parts: unknown) {
  if (!Array.isArray(parts)) {
    return null;
  }

  const textParts = parts
    .map((part) => {
      if (!part || typeof part !== "object") {
        return null;
      }

      const record = part as Record<string, unknown>;
      return typeof record.text === "string" ? record.text.trim() : null;
    })
    .filter((text): text is string => typeof text === "string" && text.trim().length > 0);

  if (textParts.length === 0) {
    return null;
  }

  return textParts.join("\n");
}

const TEXTUAL_PRIORITY_KEYS = [
  "text",
  "parts",
  "content",
  "message",
  "messages",
  "body",
  "data",
  "output",
  "response",
  "candidate",
  "candidates",
  "result",
  "results",
  "item",
  "items",
] as const;

const IGNORED_METADATA_KEYS = new Set([
  "thoughtSignature",
  "finishReason",
  "index",
  "role",
  "id",
  "status",
  "type",
  "createdAt",
  "updatedAt",
  "tokenCount",
  "usageMetadata",
]);

function extractTextRecursively(value: unknown, visited = new WeakSet<object>()): string[] {
  if (typeof value === "string") {
    const normalized = value.trim();
    return normalized ? [normalized] : [];
  }

  if (!value || typeof value !== "object") {
    return [];
  }

  if (visited.has(value)) {
    return [];
  }

  visited.add(value);

  if (Array.isArray(value)) {
    return value.flatMap((item) => extractTextRecursively(item, visited));
  }

  const record = value as Record<string, unknown>;
  const partsText = extractTextFromParts(record.parts);

  if (partsText) {
    return [partsText];
  }

  const collectedTexts: string[] = [];

  for (const key of TEXTUAL_PRIORITY_KEYS) {
    if (!(key in record)) {
      continue;
    }

    collectedTexts.push(...extractTextRecursively(record[key], visited));
  }

  if (collectedTexts.length > 0) {
    return collectedTexts;
  }

  for (const [key, nestedValue] of Object.entries(record)) {
    if (IGNORED_METADATA_KEYS.has(key)) {
      continue;
    }

    collectedTexts.push(...extractTextRecursively(nestedValue, visited));
  }

  return collectedTexts;
}

function extractTextFromStructuredRecord(record: Record<string, unknown>) {
  if (typeof record.text === "string") {
    return record.text;
  }

  if (
    record.body &&
    typeof record.body === "object" &&
    record.body !== null &&
    typeof (record.body as Record<string, unknown>).text === "string"
  ) {
    return (record.body as Record<string, string>).text;
  }

  if (
    record.content &&
    typeof record.content === "object" &&
    record.content !== null
  ) {
    const contentRecord = record.content as Record<string, unknown>;
    const contentText = extractTextFromParts(contentRecord.parts);

    if (contentText) {
      return contentText;
    }
  }

  const recursiveTexts = extractTextRecursively(record);

  if (recursiveTexts.length > 0) {
    return recursiveTexts.join("\n");
  }

  return null;
}

function normalizeVoiceNoteBody(body: unknown) {
  if (typeof body === "string") {
    const raw = body.trim();

    if (!raw) {
      return { text: "" };
    }

    const normalizedRaw = raw.replace(/^body\s*:\s*/i, "");

    if (normalizedRaw.startsWith("{") || normalizedRaw.startsWith("[")) {
      try {
        const parsed = JSON.parse(normalizedRaw) as unknown;

        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            if (!item || typeof item !== "object") {
              continue;
            }

            const parsedText = extractTextFromStructuredRecord(
              item as Record<string, unknown>,
            );

            if (parsedText) {
              return { text: parsedText };
            }
          }
        }

        const parsedText =
          parsed && typeof parsed === "object"
            ? extractTextFromStructuredRecord(parsed as Record<string, unknown>)
            : null;

        if (parsedText) {
          return { text: parsedText };
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

  if (Array.isArray(body)) {
    for (const item of body) {
      if (!item || typeof item !== "object") {
        continue;
      }

      const record = item as Record<string, unknown>;
      const extractedText = extractTextFromStructuredRecord(record);

      if (extractedText) {
        return { text: extractedText };
      }
    }
  }

  if (body && typeof body === "object") {
    const record = body as Record<string, unknown>;
    const extractedText = extractTextFromStructuredRecord(record);

    if (extractedText) {
      return { text: extractedText };
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
