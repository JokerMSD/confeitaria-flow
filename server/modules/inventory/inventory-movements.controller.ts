import type { Request, Response } from "express";
import { InventoryMovementsService } from "../../services/inventory-movements.service";

export class InventoryMovementsController {
  private readonly inventoryMovementsService = new InventoryMovementsService();

  async list(req: Request, res: Response) {
    const data = await this.inventoryMovementsService.list(req.query as any);
    res.json({
      data,
      filters: req.query,
    });
  }

  async create(req: Request, res: Response) {
    const data = await this.inventoryMovementsService.create(req.body.data);
    res.status(201).json({ data });
  }

  async detail(req: Request, res: Response) {
    const data = await this.inventoryMovementsService.getById(
      String(req.params.id),
    );
    res.json({ data });
  }
}
