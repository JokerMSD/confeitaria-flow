import type { Request, Response } from "express";
import { InventoryItemsService } from "../../services/inventory-items.service";

export class InventoryController {
  private readonly inventoryItemsService = new InventoryItemsService();

  async list(req: Request, res: Response) {
    const data = await this.inventoryItemsService.list(req.query as any);
    res.json({
      data,
      filters: req.query,
    });
  }

  async detail(req: Request, res: Response) {
    const data = await this.inventoryItemsService.getById(String(req.params.id));
    res.json({ data });
  }

  async create(req: Request, res: Response) {
    const data = await this.inventoryItemsService.create(req.body.data);
    res.status(201).json({ data });
  }

  async update(req: Request, res: Response) {
    const data = await this.inventoryItemsService.update(
      String(req.params.id),
      req.body.data,
    );
    res.json({ data });
  }

  async remove(req: Request, res: Response) {
    const data = await this.inventoryItemsService.remove(String(req.params.id));
    res.json({ data });
  }
}
