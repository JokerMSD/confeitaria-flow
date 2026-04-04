import type { Request, Response } from "express";
import { RecipeMediaService } from "../../services/recipe-media.service";

export class RecipeMediaController {
  private readonly recipeMediaService = new RecipeMediaService();

  async listAdmin(_req: Request, res: Response) {
    const data = await this.recipeMediaService.listAdminItems();
    res.json({ data });
  }

  async upload(req: Request, res: Response) {
    const data = await this.recipeMediaService.upload(req.body.data);
    res.status(201).json({ data });
  }

  async remove(req: Request, res: Response) {
    const data = await this.recipeMediaService.remove(String(req.params.mediaId));
    res.json({ data });
  }
}
