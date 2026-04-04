import type { Request, Response } from "express";
import { PublicStoreService } from "../../services/public-store.service";

export class PublicStoreController {
  private readonly publicStoreService = new PublicStoreService();

  async home(_req: Request, res: Response) {
    const data = await this.publicStoreService.getHome();
    res.json({ data });
  }

  async listProducts(_req: Request, res: Response) {
    const data = await this.publicStoreService.listProducts();
    res.json({ data });
  }

  async paymentConfig(_req: Request, res: Response) {
    const data = this.publicStoreService.getPaymentConfig();
    res.json({ data });
  }

  async detail(req: Request, res: Response) {
    const data = await this.publicStoreService.getProduct(String(req.params.id));
    res.json({ data });
  }

  async previewCheckout(req: Request, res: Response) {
    const data = await this.publicStoreService.previewCheckout(req.body.data);
    res.json({ data });
  }

  async checkout(req: Request, res: Response) {
    const data = await this.publicStoreService.checkout(req.body.data);
    res.status(201).json({ data });
  }

  async mercadoPagoWebhook(req: Request, res: Response) {
    const paymentId = this.publicStoreService.extractMercadoPagoPaymentId({
      query: req.query as Record<string, unknown>,
      body:
        req.body && typeof req.body === "object"
          ? (req.body as Record<string, unknown>)
          : null,
    });

    if (paymentId) {
      await this.publicStoreService.syncMercadoPagoPayment(paymentId);
    }

    res.status(200).json({ ok: true });
  }
}
