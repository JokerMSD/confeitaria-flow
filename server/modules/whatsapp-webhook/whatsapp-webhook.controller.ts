import type { Request, Response } from "express";
import { WhatsAppWebhookService, isWhatsAppUserMessage, summarizeWhatsAppWebhook } from "../../services/whatsapp-webhook.service";

export class WhatsAppWebhookController {
  private readonly whatsappWebhookService = new WhatsAppWebhookService();

  verify(req: Request, res: Response) {
    const mode =
      typeof req.query["hub.mode"] === "string" ? req.query["hub.mode"] : null;
    const verifyToken =
      typeof req.query["hub.verify_token"] === "string"
        ? req.query["hub.verify_token"]
        : null;
    const challenge =
      typeof req.query["hub.challenge"] === "string"
        ? req.query["hub.challenge"]
        : null;

    if (
      challenge &&
      this.whatsappWebhookService.isVerificationRequestValid({
        mode,
        verifyToken,
      })
    ) {
      res.status(200).send(challenge);
      return;
    }

    res.status(403).json({ message: "Webhook verification failed." });
  }

  async receive(req: Request, res: Response) {
    const payload = req.body;
    const summary = summarizeWhatsAppWebhook(payload);
    console.info(`[whatsapp-webhook] received ${summary}`);

    if (!isWhatsAppUserMessage(payload)) {
      res.status(200).json({ ok: true, forwarded: false });
      return;
    }

    await this.whatsappWebhookService.forwardToN8n(payload);
    res.status(200).json({ ok: true, forwarded: true });
  }
}
