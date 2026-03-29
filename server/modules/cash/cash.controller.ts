import type { Request, Response } from "express";
import { CashTransactionsService } from "../../services/cash-transactions.service";

export class CashController {
  private readonly cashTransactionsService = new CashTransactionsService();

  async list(req: Request, res: Response) {
    const data = await this.cashTransactionsService.list(req.query as any);
    res.json({
      data,
      filters: req.query,
    });
  }

  async summary(req: Request, res: Response) {
    const data = await this.cashTransactionsService.getSummary(
      req.query.date as string | undefined,
    );
    res.json({
      data,
      filters: req.query,
    });
  }

  async detail(req: Request, res: Response) {
    const data = await this.cashTransactionsService.getById(String(req.params.id));
    res.json({ data });
  }

  async create(req: Request, res: Response) {
    const data = await this.cashTransactionsService.create(req.body.data);
    res.status(201).json({ data });
  }

  async update(req: Request, res: Response) {
    const data = await this.cashTransactionsService.update(
      String(req.params.id),
      req.body.data,
    );
    res.json({ data });
  }

  async remove(req: Request, res: Response) {
    const data = await this.cashTransactionsService.remove(String(req.params.id));
    res.json({ data });
  }
}
