import type { Request, Response } from "express";
import {
  WhatsAppWebhookService,
  getWhatsAppWebhookDebugSnapshot,
  isWhatsAppUserMessage,
  summarizeWhatsAppWebhook,
} from "../../services/whatsapp-webhook.service";

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

    this.whatsappWebhookService.logDebug("verify request", {
      mode,
      challengePresent: Boolean(challenge),
      verifyTokenPresent: Boolean(verifyToken),
    });

    if (
      challenge &&
      this.whatsappWebhookService.isVerificationRequestValid({
        mode,
        verifyToken,
      })
    ) {
      this.whatsappWebhookService.logDebug("verify accepted");
      res.status(200).send(challenge);
      return;
    }

    this.whatsappWebhookService.logDebug("verify rejected");
    res.status(403).json({ message: "Webhook verification failed." });
  }

  async receive(req: Request, res: Response) {
    const payload = req.body;
    const summary = summarizeWhatsAppWebhook(payload);
    console.info(`[whatsapp-webhook] received ${summary}`);
    this.whatsappWebhookService.logDebug(
      "receive payload snapshot",
      getWhatsAppWebhookDebugSnapshot(payload),
    );

    if (!isWhatsAppUserMessage(payload)) {
      this.whatsappWebhookService.logDebug("receive ignored", {
        reason: "not-user-message",
        summary,
      });
      res.status(200).json({ ok: true, forwarded: false });
      return;
    }

    const forwardResult = await this.whatsappWebhookService.forwardToN8n(payload);
    this.whatsappWebhookService.logDebug("receive forward result", forwardResult);
    res.status(200).json({ ok: true, forwarded: forwardResult.forwarded });
  }
}
