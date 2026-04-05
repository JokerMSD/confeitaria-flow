import type { Request, Response } from "express";
import { OrdersService } from "../../services/orders.service";

export class OrdersController {
  private readonly ordersService = new OrdersService();

  async list(req: Request, res: Response) {
    const data = await this.ordersService.list(req.query as any);
    res.json({
      data,
      filters: req.query,
    });
  }

  async queue(_req: Request, res: Response) {
    const data = await this.ordersService.listQueue();
    res.json({ data });
  }

  async lookup(_req: Request, res: Response) {
    const data = await this.ordersService.listLookup();
    res.json({ data });
  }

  async dashboardSummary(req: Request, res: Response) {
    const data = await this.ordersService.getDashboardSummary(req.query as any);
    res.json({
      data,
      filters: req.query,
    });
  }

  async detail(req: Request, res: Response) {
    const data = await this.ordersService.getById(String(req.params.id));
    res.json({ data });
  }

  async create(req: Request, res: Response) {
    const data = await this.ordersService.create(req.body.data);
    res.status(201).json({ data });
  }

  async update(req: Request, res: Response) {
    const data = await this.ordersService.update(String(req.params.id), req.body.data);
    res.json({ data });
  }

  async confirm(req: Request, res: Response) {
    const data = await this.ordersService.confirm(String(req.params.id));
    res.json({ data });
  }

  async updateStatus(req: Request, res: Response) {
    const data = await this.ordersService.updateStatus(
      String(req.params.id),
      req.body.data.status,
      req.body.data.lastKnownUpdatedAt,
    );
    res.json({ data });
  }

  async remove(req: Request, res: Response) {
    const data = await this.ordersService.remove(String(req.params.id));
    res.json({ data });
  }
}
