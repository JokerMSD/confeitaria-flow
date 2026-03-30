import type { Request, Response } from "express";
import { RecipesService } from "../../services/recipes.service";

export class RecipesController {
  private readonly recipesService = new RecipesService();

  async list(req: Request, res: Response) {
    const data = await this.recipesService.list(req.query as any);
    res.json({
      data,
      filters: req.query,
    });
  }

  async lookup(req: Request, res: Response) {
    const data = await this.recipesService.listLookup(req.query.kind as any);
    res.json({ data });
  }

  async detail(req: Request, res: Response) {
    const data = await this.recipesService.getById(String(req.params.id));
    res.json({ data });
  }

  async create(req: Request, res: Response) {
    const data = await this.recipesService.create(req.body.data);
    res.status(201).json({ data });
  }

  async update(req: Request, res: Response) {
    const data = await this.recipesService.update(String(req.params.id), req.body.data);
    res.json({ data });
  }

  async remove(req: Request, res: Response) {
    const data = await this.recipesService.remove(String(req.params.id));
    res.json({ data });
  }
}
