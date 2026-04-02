import type { Request, Response } from "express";
import { ProductAdditionalsService } from "../../services/product-additionals.service";

export class ProductAdditionalsController {
  private readonly productAdditionalsService = new ProductAdditionalsService();

  async list(req: Request, res: Response) {
    const data = await this.productAdditionalsService.listByProductRecipeId(
      String(req.query.productRecipeId),
    );

    res.json({
      data,
      filters: req.query,
    });
  }

  async detail(req: Request, res: Response) {
    const data = await this.productAdditionalsService.getById(
      String(req.params.id),
    );

    res.json({ data });
  }

  async create(req: Request, res: Response) {
    const data = await this.productAdditionalsService.create(req.body.data);
    res.status(201).json({ data });
  }

  async update(req: Request, res: Response) {
    const data = await this.productAdditionalsService.update(
      String(req.params.id),
      req.body.data,
    );

    res.json({ data });
  }

  async remove(req: Request, res: Response) {
    const data = await this.productAdditionalsService.remove(
      String(req.params.id),
    );

    res.json({ data });
  }
}
