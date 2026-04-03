import type { Request, Response } from "express";
import { ProductionForecastService } from "../../services/production-forecast.service";

export class ProductionController {
  private readonly productionForecastService = new ProductionForecastService();

  async forecast(req: Request, res: Response) {
    const data = await this.productionForecastService.getForecast(req.query as any);
    res.json({ data });
  }
}
