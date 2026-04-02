import type { Request, Response } from "express";
import { CustomersService } from "../../services/customers.service";

export class CustomersController {
  private readonly customersService = new CustomersService();

  async list(_req: Request, res: Response) {
    const data = await this.customersService.list();
    res.json({ data });
  }

  async detail(req: Request, res: Response) {
    const data = await this.customersService.getById(String(req.params.id));
    res.json({ data });
  }

  async create(req: Request, res: Response) {
    const data = await this.customersService.create(req.body.data);
    res.status(201).json({ data });
  }

  async update(req: Request, res: Response) {
    const data = await this.customersService.update(
      String(req.params.id),
      req.body.data,
    );
    res.json({ data });
  }

  async deactivate(req: Request, res: Response) {
    const data = await this.customersService.deactivate(String(req.params.id));
    res.json({ data });
  }

  async remove(req: Request, res: Response) {
    await this.customersService.delete(String(req.params.id));
    res.status(204).end();
  }
}
