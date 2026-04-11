import type { Request, Response } from "express";
import { TtsService } from "../../services/tts.service";

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
