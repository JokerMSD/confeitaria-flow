import type { Request, Response } from "express";
import { InventoryReceiptImportService } from "../../services/inventory-receipt-import.service";

export class InventoryReceiptImportController {
  private readonly inventoryReceiptImportService =
    new InventoryReceiptImportService();

  async analyze(req: Request, res: Response) {
    const data = await this.inventoryReceiptImportService.analyze(req.body.data);
    res.json({ data });
  }

  async confirm(req: Request, res: Response) {
    const data = await this.inventoryReceiptImportService.confirm(req.body.data);
    res.status(201).json({ data });
  }
}
