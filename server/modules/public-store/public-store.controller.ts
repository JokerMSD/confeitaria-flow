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
}
