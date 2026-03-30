import { RecipesService } from "./recipes.service";

type Executor = any;

export class OrderRecipeConsumptionService {
  private readonly recipesService = new RecipesService();

  async syncOrderConsumption(
    input: {
      orderId: string;
      orderNumber: string;
      status: string;
      items: Array<{
        recipeId: string | null;
        quantity: number;
        productName?: string;
      }>;
    },
    executor: Executor,
  ) {
    await this.recipesService.syncOrderInventoryConsumption(
      {
        id: input.orderId,
        orderNumber: input.orderNumber,
        status: input.status,
      },
      input.items.map((item) => ({
        recipeId: item.recipeId,
        quantity: item.quantity,
        productName: item.productName ?? "",
      })),
      executor,
    );
  }
}
