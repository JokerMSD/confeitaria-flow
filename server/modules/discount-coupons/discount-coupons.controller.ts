import type { Request, Response } from "express";
import { DiscountCouponsService } from "../../services/discount-coupons.service";

export class DiscountCouponsController {
  private readonly service = new DiscountCouponsService();

  async list(req: Request, res: Response) {
    const data = await this.service.list(
      typeof req.query.search === "string" ? req.query.search : undefined,
    );
    res.json({ data });
  }

  async detail(req: Request, res: Response) {
    const data = await this.service.getById(String(req.params.id));
    res.json({ data });
  }

  async create(req: Request, res: Response) {
    const data = await this.service.create(req.body.data);
    res.status(201).json({ data });
  }

  async update(req: Request, res: Response) {
    const data = await this.service.update(String(req.params.id), req.body.data);
    res.json({ data });
  }
}
