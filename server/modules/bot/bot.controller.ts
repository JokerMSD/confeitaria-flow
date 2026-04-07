import type { Request, Response } from "express";
import { BotService } from "../../services/bot.service";

export class BotController {
  private readonly botService = new BotService();

  async storeSummary(_req: Request, res: Response) {
    const data = await this.botService.getStoreSummary();
    res.json({ data });
  }

  async productDetail(req: Request, res: Response) {
    const data = await this.botService.getProductDetail(String(req.params.id));
    res.json({ data });
  }

  async availability(req: Request, res: Response) {
    const data = await this.botService.getAvailability({
      deliveryMode: String(req.query.deliveryMode) as "Entrega" | "Retirada",
      selectedDate:
        typeof req.query.selectedDate === "string"
          ? req.query.selectedDate
          : undefined,
    });
    res.json({ data });
  }

  async orderStatus(req: Request, res: Response) {
    const data = await this.botService.getOrderStatus(req.body.data);
    res.json({ data });
  }

  async checkoutLink(req: Request, res: Response) {
    const data = await this.botService.getCheckoutLink(req.body.data);
    res.json({ data });
  }
}
